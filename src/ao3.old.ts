import { load } from "cheerio";
import { CookieJar } from "request";
import * as request from "request-promise-native";
import { Cookie, CookieJar as ToughCookieJar } from "tough-cookie";
import { URLSearchParams } from "url";

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

	pagesInList(listpage: string) {
		return this.page(listpage).then((source: string) => {
			let parsedPage = load(source);
			let navigationNumbers = parsedPage("li a[href*='page']")
				.toArray()
				.map((elem) => elem.attribs.href)
				.map((url) => new URLSearchParams(url.replace(/.*\?/, "")))
				.map((params) => +params.get("page")) // unary + converts to number
				.reduce((accum, curr) => (accum.includes(curr) ? accum : [...accum, curr]), []); // Strip duplicates
			return navigationNumbers.reduce((prev, cur) => (cur > prev ? cur : prev), 0);
		});
	}

	get username(): Promise<string> {
		return this.page("https://archiveofourown.org").then((data: string) => {
			let matches = data.match(/<li><a href="\/users\/(\w+)">My Dashboard<\/a><\/li>/);
			return matches ? matches[1] : "";
		});
	}

	get isLoggedIn(): Promise<boolean> {
		return this.username.then((name) => name != "");
	}
}
