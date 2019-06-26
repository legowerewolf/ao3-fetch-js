import { CookieJar } from "request";
import * as request from "request-promise-native";
import { Cookie, CookieJar as ToughCookieJar } from "tough-cookie";

const _idx = (root: any, path: string[]) => path.reduce((o: any, prop: string) => (o == undefined ? o : o[prop]), root);

export class AO3 {
	cookieJar: CookieJar = request.jar();

	constructor(jar: ToughCookieJar.Serialized = null) {
		if (jar) {
			(this.cookieJar as any)._jar = ToughCookieJar.deserializeSync(jar);
		}
	}

	login(username: string, password: string, tosVersion: string): Promise<string> {
		this.cookieJar.setCookie(Cookie.parse(`accepted_tos=${tosVersion}`), "https://archiveofourown.org");

		return request
			.get({
				uri: "https://archiveofourown.org/token_dispenser.json",
				jar: this.cookieJar,
			})
			.then((resp) => JSON.parse(resp))
			.then((json) => json.token)
			.then((token) => {
				return request.post({
					uri: "https://archiveofourown.org/users/login",
					jar: this.cookieJar,
					formData: {
						utf8: "✓",
						authenticity_token: token,
						"user[login]": username,
						"user[password]": password,
						commit: "Log In",
					},
					headers: {
						accept: "text/html,application/xhtml+xml,application/xml",
						"content-type": "application/x-www-form-urlencoded",
					},
					resolveWithFullResponse: true,
					simple: false,
				});
			})
			.then(() => {
				return this.username;
			});
	}

	page(url: string) {
		return request.get({
			uri: url,
			jar: this.cookieJar,
		});
	}

	worksInList(listpage: string) {
		this.page(listpage).then((source: string) => {
			let matches = source.match(/<a href="\S*">(\d+)<\/a>/g);
			let last = matches[matches.length - 1].match(/<a href="\S*">(\d+)<\/a>/)[1];
			console.log(last);
		});
	}

	get username(): Promise<string> {
		return request
			.get({
				uri: "https://archiveofourown.org",
				jar: this.cookieJar,
			})
			.then((data: string) => {
				let matches = data.match(/<li><a href="\/users\/(\w+)">My Dashboard<\/a><\/li>/);
				return matches ? matches[1] : "";
			});
	}

	get isLoggedIn(): Promise<boolean> {
		return this.username.then((name) => name != "");
	}
}
