// form example

LoginForm = initializeWith({
	state: () => ({})
}, (vdom) => {
	const validate_result = validate(vdom.state);
	
	return v("form", [
		v("input", {onchange: (vdom, val) => vdom.state.username = val}),
		v("input", bindInput(vdom, "username")),
		v("button", {onclick: (vdom, val) => api.submit(vdom.state)}, "Submit"),
		validate_result && v("p.error_result", validate_result.message)
	])
})

const form_context = new FormContext();

v(Form, {props: {context: form_context}}, [
	v(Input, {props: {context: form_context, label: "username"}}),
])

MakeForm(form_context, [
	MakeInput(form_context, "username"),
	v("label", {for: "username"}, "Username: "),
	MakeSubmit((form_val) => api.submit(form_val)),
	MakeError(form_context)
])