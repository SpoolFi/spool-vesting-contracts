import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "hardhat-contract-sizer";
import "solidity-coverage";
import '@typechain/hardhat';
import '@primitivefi/hardhat-dodoc';
import {task} from "hardhat/config";
import * as glob from "glob";
import * as path from "path";

task("generate-docs", "Generate docs from contract comments")
    .setAction(async (_, hre) => {

    const excludedContracts = hre.config.dodoc.exclude
        .map(p => glob.sync(path.resolve(p), {nodir: true}))
        .flat()
        .map(p => path.basename(p, ".sol"))

    hre.config.dodoc.exclude = excludedContracts;
    hre.config.dodoc.runOnCompile = true;

    await hre.run("compile");
});

export default {
    paths: {
        sources: "./contracts",
        cache: "./cache",
        artifacts: "./build",
        tests: "./test",
    },
    networks: {
        hardhat: {
            chainId: 1337,
            allowUnlimitedContractSize: false,
            hardfork: "london",
        },
    },
    dodoc: {
        runOnCompile: false,
        exclude: ["contracts/external/**/*", "contracts/mocks/**/*"]
    },
    typechain: {
        outDir: 'build/types',
        target: 'ethers-v5',
        alwaysGenerateOverloads: false
    },
    solidity: {
        compilers: [
            {
                version: "0.8.11",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 99999,
                    },
                },
            },
        ],
    },
};
