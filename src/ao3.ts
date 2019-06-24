import idx from "idx";
import * as request from "request-promise-native";

const _idx = (root: any, path: string[]) => path.reduce((o: any, prop: string) => (o == undefined ? o : o[prop]), root);

export class AO3 {
	cookieJar: any;

	constructor(jar: any = request.jar()) {
		this.cookieJar = jar;
		console.log(jar);
	}

	login(username: string, password: string, tosVersion: string) {
		this.cookieJar.setCookie(request.cookie(`accepted_tos=${tosVersion}`), "https://archiveofourown.org");

		return request
			.get("https://archiveofourown.org/token_dispenser.json", {
				jar: this.cookieJar,
			})
			.then((resp) => JSON.parse(resp))
			.then((json) => json.token)
			.then((token) => {
				return request.post("https://archiveofourown.org/users/login", {
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
			.then((response) => {
				return String(response.headers.location).match(/[^\/]+$/)[0];
			});
	}

	get username() {
		request
			.get("https://archiveofourown.org", {
				jar: this.cookieJar,
			})
			.then((data) => {
				console.log(data);
				console.log(this.cookieJar);
			});
		return null;
	}

	get isLoggedIn() {
		//return _idx(this.cookieJar, ["_jar", "store", "idx", "archiveofourown.org", "/", "user_credentials"]) != undefined;
		return idx(this.cookieJar, (_: any) => _._jar.store.idx["archiveofourown.org"]["/"].user_credentials) != undefined;
	}
}
