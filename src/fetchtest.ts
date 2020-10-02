function logAndContinue<T>(observed: T): Promise<T> {
	console.log(observed);
	return Promise.resolve(observed);
}

fetch("https://postman-echo.com/post", {
	method: "POST",
	body: (() => {
		let form = new FormData();
		form.append("utf8", "✓");
		form.append("authenticity_token", "token");
		form.append("user[login]", "user");
		form.append("user[password]", "pass");
		form.append("user[remember_me]", "1");
		form.append("commit", "Log In");
		return form;
	})(),
	headers: {
		"content-type": "application/x-www-form-urlencoded",
		accept: "text/html,application/xhtml+xml,application/xml",
		cookie: "name=value",
	},
	credentials: "include",
})
	.then(logAndContinue)
	.then((resp) => resp.json())
	.then(logAndContinue);
