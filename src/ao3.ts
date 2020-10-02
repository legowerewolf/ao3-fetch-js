import { parse } from "./deps.ts";

let config = parse(Deno.args);

let sess = "";

export function login(username: string, password: string) {
	return fetch("https://archiveofourown.org/token_dispenser.json", {
		credentials: "include",
	})
		.then(saveSession)
		.then((response) => response.json().then((decoded) => decoded.token))
		.then((token) =>
			fetch("https://archiveofourown.org/users/login", {
				method: "POST",
				body: (() => {
					let form = new URLSearchParams();
					form.append("utf8", "✓");
					form.append("authenticity_token", token);
					form.append("user[login]", username);
					form.append("user[password]", password);
					form.append("user[remember_me]", "1");
					form.append("commit", "Log In");
					return form.toString();
				})(),
				headers: {
					"content-type": "application/x-www-form-urlencoded",
					accept: "text/html,application/xhtml+xml,application/xml",
					cookie: sess,
				},
			})
		)
		.then(logAndContinue)
		.then((resp) => resp.text())
		.then(logAndContinue);
}

login("Legowerewolf", config.password ?? "test").then(() => {
	console.log(sess);
});

function logAndContinue<T>(observed: T): Promise<T> {
	console.log(observed);
	return Promise.resolve(observed);
}
function saveSession(resp: Response): Promise<Response> {
	sess = (resp.headers.get("set-cookie") as string) ?? sess;
	return Promise.resolve(resp);
}
