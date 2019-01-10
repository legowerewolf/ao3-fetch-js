import { Cookie } from 'tough-cookie';
import request = require('request-promise-native');

const getProp = (root: any, path: string[]) => path.reduce((o: any, prop: string) => o == undefined ? o : o[prop], root);

export class AO3 {
    static tosVersion: string = "20180523"

    cookieJar: any = request.jar();
    username: string = "";

    constructor() {
    }

    login(username: string, password: string, tosVersion: string = AO3.tosVersion) {

        this.cookieJar.setCookie(
            new Cookie({
                key: "accepted_tos",
                value: tosVersion
            }),
            "https://archiveofourown.org"
        )

        return request.get("https://archiveofourown.org/token_dispenser.json", {
            jar: this.cookieJar
        })
            .then(resp => JSON.parse(resp))
            .then(json => json.token)
            .then(token => {
                return request.post("https://archiveofourown.org/users/login",
                    {
                        jar: this.cookieJar,
                        formData: {
                            "utf8": "✓",
                            "authenticity_token": token,
                            "user[login]": username,
                            "user[password]": password,
                            "commit": "Log In"
                        },
                        headers: {
                            "accept": "text/html,application/xhtml+xml,application/xml",
                            "content-type": "application/x-www-form-urlencoded"
                        },
                        resolveWithFullResponse: true,
                        simple: false
                    })
            })
            .then((response) => {
                this.username = String(response.headers.location).match(/[^\/]+$/)[0];
                return this.username;
            })
    }

    get isLoggedIn() {
        return getProp(this.cookieJar, ['_jar', 'store', 'idx', 'archiveofourown.org', '/', 'user_credentials']) != undefined;
    }
}
