import inquirer = require("inquirer");
import curry = require("lodash/fp/curry");
import { AO3 } from "./ao3";

const is = curry((option: string, value: any, answers: any) => answers[option] === value)

const menuIs = is("main-menu")

const multi = (...predicates: any[]) => (answers: any) => predicates.reduce((a: boolean, p: Function) => p(answers) && a, true);

const passwordTransformer = (input: string) => "*".repeat(input.length);

let globals = {
    session: new AO3()
};

async function main() {

    inquirer.prompt([
        {
            name: "main-menu",
            type: "list",
            message: "Select an option:",
            choices: [
                "view works list",
                new inquirer.Separator(),
                "login",
                "logout",
                "exit"
            ]
        },
        {
            name: "works-view",
            type: "input",
            message: "Enter the page of works to crawl:",
            when: menuIs("view works list")
        },
        {
            name: "username",
            type: "input",
            message: "Username:",
            when: menuIs("login")
        },
        {
            name: "password",
            type: "input",
            message: "Password:",
            when: menuIs("login"),
            transformer: passwordTransformer
        },
        {
            name: "tosVersion",
            type: "input",
            message: "AO3 TOS revision date (YYYYMMDD):",
            when: menuIs('login')
        }
    ])
        .then((values: any) => {
            return Promise.resolve(
                [
                    {
                        predicate: menuIs("login"),
                        handler: (answers: any) => {
                            console.log("Attempting to log in...");
                            return globals.session.login(answers.username, answers.password, answers.tosVersion)
                                .then((username) => {
                                    if (globals.session.isLoggedIn) console.log(`Logged in as ${username}`);
                                    else console.log("Error logging in. Please try again.");
                                })
                        }
                    },
                    {
                        predicate: menuIs("logout"),
                        handler: () => {
                            globals.session = new AO3();
                            console.log("Logged out.");
                        }
                    },
                    {
                        predicate: menuIs("exit"),
                        handler: () => { process.exit(0); }
                    }
                ].find((element) => element.predicate(values)).handler(values))
        })
        .then(() => { main(); })
}

main();