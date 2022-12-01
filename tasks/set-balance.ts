import {task} from "hardhat/config";
import {asMoney, printTaskInfo, printTaskName} from "../lib/money";
import {noop} from "lodash";

task("set-balance", "Set balance of address")
    .addParam("address", "address", undefined, undefined, true)
    .addParam("amount", "amount (in ether)", undefined, undefined, true)
    .addFlag("skipNetwork")
    .setAction(
        async (taskArgs, hre) => {
            const address: string | undefined = taskArgs.address

            const ethers = hre.ethers;
            const accounts = await ethers.getSigners();
            const provider = await ethers.provider;
            const amount = ethers.utils.parseEther(taskArgs.amount || "2").toHexString() || "0x100000000000000000"

            await printTaskInfo("SET BALANCE", hre, taskArgs)

            const workload: (string | undefined)[] = (!!address) ? [address] : accounts.map(account => account.address)

            console.log(`setting ${asMoney(amount)} to `, workload, `\n`)

            workload.map(account => {
                console.log(`hardhat_setBalance(${account}, ${amount})`)
                if (!account) throw new Error(`!account`)
                hre.network.provider.send("hardhat_setBalance", [
                    // @ts-ignore
                    account,
                    amount,
                ])
            })

            console.log()

            await hre.run('balances', "--skipNetwork")

        });
