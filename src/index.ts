import * as program from "commander";
import { promises } from "fs";
import { prompt } from "inquirer";
import * as ora from "ora";
import { homedir } from "os";
import { join } from "path";
import { AO3 } from "./ao3";
import { Config } from "./types";
import request = require("request");

const configPath = join(homedir(), ".ao3");

promises
	.readFile(configPath)
	.then(
		(fileContents) => JSON.parse(fileContents.toString()),
		() => {
			return {};
		}
	)
	.then((config: Config) => {
		let client = new AO3(config.session);

		program
			.command("login")
			.description("log in with AO3 credentials")
			.action(() => {
				prompt([
					{
						name: "username",
						type: "input",
						message: "Username:",
					},
					{
						name: "password",
						type: "password",
						message: "Password:",
					},
					{
						name: "TOSdate",
						type: "input",
						message: "Last AO3 TOS update date: (YYYYMMDD/where/why)",
						validate: (input) => {
							switch (input) {
								case "where":
									return "You can find the AO3 Terms of Service at https://archiveofourown.org/tos.";
								case "why":
									return "The AO3 API won't respond without the user accepting the latest Terms of Service.";
								default:
									return true; // figure out how to validate the date
							}
						},
					},
				]).then((responses: any) => {
					let spinner = ora("Logging in...").start();
					client
						.login(responses.username, responses.password, responses.TOSdate)
						.then((name) => {
							spinner.succeed(`Logged in as ${name}`);
						})
						.catch((reason) => {
							spinner.fail();
							console.error(reason);
						})
						.finally(() => {
							done();
						});
				});
			});

		program
			.command("logout")
			.description("delete stored AO3 session")
			.action(() => {
				prompt([
					{
						name: "confirmLogout",
						type: "confirm",
						message: "Are you sure you wish to sign out of AO3?",
					},
				]).then((responses: any) => {
					if (responses.confirmLogout) {
						client.cookieJar = undefined;
						done();
					}
				});
			});

		program
			.command("whoami")
			.description("check who's currently signed in")
			.action(() => {
				client.username;
				done();
			});

		program.parse(process.argv);

		function done() {
			let spinner = ora("Saving status...").start();

			config.session = client.cookieJar;

			promises.writeFile(configPath, Buffer.from(JSON.stringify(config))).then(
				() => {
					spinner.succeed("Saved!");
				},
				() => {
					spinner.fail("Save failed. Oops!");
				}
			);
		}
	});
