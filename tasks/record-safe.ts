import {task} from "hardhat/config";
import fs from "fs";
import _, {add} from "lodash";
import path from "path";
import {load} from "dotenv";
import {ethers} from "hardhat";
import {safeSingleton} from "../src/contracts";
import Bluebird from "bluebird";
import {getSingletonAddress} from "../src/information";
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {printTaskInfo} from "../lib/money";

// const file = "safes.json"
const file = (hre:HardhatRuntimeEnvironment) => `safes-${hre.network.name}.json`

//region loadSafes
export function loadSafes(hre:HardhatRuntimeEnvironment) : string[] {
    let data = undefined
    const path = file(hre)

    try {
        data = String(fs.readFileSync(path))
    } catch (e) {
        return []
    }

    return JSON.parse(data)
}
//endregion

export function writeSafes(hre: HardhatRuntimeEnvironment, safes:string[]) {
    const string = JSON.stringify(_.uniq(safes))
    fs.writeFileSync(file(hre), string)
}

export async function isSafe(hre:HardhatRuntimeEnvironment, address:string) {
    try {
        const safe = await safeSingleton(hre, address)
        const singleton = await getSingletonAddress(hre, await safe.resolvedAddress)
        await safe.VERSION()

        // await hre.run("info", {address: address})
        // console.log(`IS A SAFE: ${address}`)
        return true
    } catch (e) {
        // console.log(`NOT A SAFE: ${address}`)
    }
    // console.log(`NOT A SAFE: ${address}`)
    return false
}

task("prune-safes")
    .setAction(async (taskArgs, hre) => {
        await printTaskInfo("prune-safes", hre, taskArgs)
        const safes = loadSafes(hre)
        console.log(`before`, safes)
        const yes = await Bluebird.filter(safes, async safe => await isSafe(hre, safe))
        console.log(`after`, yes)
        writeSafes(hre, yes)
    })

task("find-safes")
    .setAction(async (taskArgs, hre) => {
        await printTaskInfo("find-safes", hre, taskArgs)
        const safes = loadSafes(hre)

        try {
            const confirmed = _.filter(await Bluebird.map(safes, async address => {
                return (await isSafe(hre, address)) ? address : undefined
            }), value => !_.isNil(value))

            console.log(`safes = `, confirmed)
        } catch (e) {
            // console.error(`error`, e)
        } finally {
            console.log(`done`)
        }
    })

task("record-safe", "Prints the balances of named accounts")
    .addParam("address", "address of the safe")
    .setAction(async (taskArgs, hre) => {
        await printTaskInfo("record-safe", hre, taskArgs)

        const address = taskArgs.address!!
        const safes = loadSafes(hre)
        safes.push(address)
        writeSafes(hre, safes)

        console.log(`saved ${address} to ${path.resolve(file(hre))}`, safes)
    })
