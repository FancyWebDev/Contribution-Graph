async function getData(): Promise<any>{
	const request = await fetch('https://dpg.gg/test/calendar.json')
	return await request.json()
}

export { getData }