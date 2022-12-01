import {task} from "hardhat/config";
import Bluebird from 'bluebird'

import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {
    asMoney,
    filterUnnamed,
    NamedAccounts,
    printNetwork, printTaskInfo,
    printTaskName,
    toAddress,
    toName,
    withName
} from "../lib/money";
import _, {noop} from "lodash";
import {HardhatRuntimeEnvironment} from "hardhat/types";


task("balances", "Prints the balances of named accounts")
    .addFlag(`all`, 'show all accounts (not just NAMED)')
    .addFlag("skipNetwork")
    .setAction(async (taskArgs, hre) => {
        const isAll = () => !!taskArgs.all;

        // @ts-ignore
        const ethers = hre.ethers;
        const signers = await ethers.getSigners()
        const provider = await ethers.provider;
        const names = await hre.getNamedAccounts()
        const accounts = (isAll() ? signers : filterUnnamed(names, signers) as SignerWithAddress[])

        await printTaskInfo("BALANCES", hre, taskArgs)


        const balances = (await Promise.all(
            accounts.map(toAddress)
                .map(async (address: string) =>
                    Bluebird.props({
                        index: signers.map(toAddress).indexOf(address),
                        address,
                        name: toName(names, address),
                        balance: asMoney(provider.getBalance(address))
                    }))
                .concat(Bluebird.props((async () => {
                    const address = (await provider.getSigner().getAddress())!!
                    return {
                        index: signers.map(toAddress).indexOf(address),
                        address,
                        name: 'PROVIDER',
                        balance: asMoney(provider.getSigner().getBalance())
                    }
                })()))))
            .sort((a: any, b: any) => {
                return a.index > b.index ? 1 : -1
            })

        const table = balances.map(info => toBalancesRow(info))

        console.log((await toBalancesTable(table)).toString());
    })

function toBalancesRow(info: { address: string; name: string; balance: string; index: number }) {
    return [
        {
            hAlign: 'left',
            content: info.index,
        },
        {
            hAlign: 'left',
            content: info.name,
        },
        {
            // colSpan: 4,
            content: info.address,
        },
        {
            hAlign: 'right',
            content: info.balance,
        },
    ];
}

async function toBalancesTable(rows: any[]) {
    const Table = await import('cli-table3')
    const padding = 2;
    const table = new Table.default({
        // set width of first column dynamically
        colWidths: [padding * 2 + rows.length.toString().length],
        style: {head: [], border: [], 'padding-left': padding, 'padding-right': padding},
        chars: {
            mid: '·',
            'top-mid': '|',
            'left-mid': ' ·',
            'mid-mid': '|',
            'right-mid': '·',
            left: ' |',
            'top-left': ' ·',
            'top-right': '·',
            'bottom-left': ' ·',
            'bottom-right': '·',
            middle: '·',
            top: '-',
            bottom: '-',
            'bottom-mid': '|',
        },
    });
    // table.push([
    //     {
    //         hAlign: 'center',
    //         colSpan: 2,
    //         content: `Network: ${ hre.network.name }`,
    //     },
    //     {
    //         hAlign: 'center',
    //         content: `Chain ID: x`,
    //     },
    //     {
    //         hAlign: 'center',
    //         content: 'x'
    //     },
    //     {
    //         hAlign: 'center',
    //         content: 'x'
    //     }
    // ]);

    table.push([
        {
            content: 'Index'
        },
        {
            content: 'Name'
        },
        {
            content: 'Account'
        },
        {
            content: 'Native Balance (wei)',
        }
    ]);
    table.push(...rows)
    return table
}
