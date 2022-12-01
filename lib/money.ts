import {BigNumberish, ethers} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import _, {noop} from "lodash";
import {Address} from "hardhat-deploy/types";
import {HardhatRuntimeEnvironment} from "hardhat/types";

export type Optional<T> = T | undefined
export type AddressIsh = SignerWithAddress | string
export type Lazy<T> = T | Promise<T>
export type NamedAccounts = { [name: string]: Address }

export function isPromise(thing: any) {
    return (thing != null && typeof (thing as any).then === 'function')
}

export function lazyExec<T, V>(thing: Lazy<T>, exec: (thing: T) => V) {
    return isPromise(thing) ? Promise.resolve(thing).then(exec) : exec(thing as T)
}

export function asMoney(amount: Lazy<BigNumberish>, currency: string = 'ether'): Lazy<string> {
    return lazyExec(amount, (num: BigNumberish) => `${ethers.utils.formatUnits(num, currency)} ${currency}`)
}

export function toName(names: NamedAccounts, account: AddressIsh, defaultValue: string = "Unnamed"): string {
    return (optName(names, account)) || defaultValue
}

export function optName(names: NamedAccounts, account: AddressIsh): string | undefined {
    return _.findKey(names, (value: any, key: any) => value === toAddress(account))
}

export function filterUnnamed(names: NamedAccounts, accounts: AddressIsh[]) {
    return accounts
        // .map(account => toAddress(account))
        .filter(address => isNamed(names, address))
}

// export function omitUnnamed(names: NamedAccounts, accounts: AddressIsh[]) {
//     return _.omitBy(names, (account) => isNamed(names, account))
// }

export function isNamed(names: NamedAccounts, account: Optional<AddressIsh>): boolean {
    return (!!account) ? !!optName(names, account!!) : false
}


export function toAddress(account: AddressIsh): string {
    return typeof account === 'string' ?
        account :
        (account as SignerWithAddress).address;
}

export function withName(names: NamedAccounts, account: AddressIsh, overrides?: NamedAccounts) {
    const name = ((!!overrides) ? optName(overrides, account) : undefined) || toName(names, account)
    const value = toAddress(account)

    return `{ ${name}: ${value} }`
}

export async function printTaskInfo(name: string, hre: HardhatRuntimeEnvironment, taskArgs: any) {
    printTaskName("BALANCES")

    taskArgs.skipNetwork ? noop() : await printNetwork(hre)
}

export function printTaskName(name: string) {
    console.log(`---------------- ${name} ----------------`)
}

export async function printNetwork(hre: HardhatRuntimeEnvironment) {
    console.log()
    console.log(`NETWORK = `, _.merge({
        // url: hre.ethers.provider.connection.url,
    }, _.pick(hre.network, [
        'name',
        'live',
        'config.url',
        'config.forking',
        'config.accounts',
        'config.gasPrice',
        'config.minGasPrice',
        'config.gas',
        'config.gasMultiplier',
        'config.blockGasLimit',
    ]), {
        namedAccounts: await hre.getNamedAccounts(),
    }))
    console.log()
}

