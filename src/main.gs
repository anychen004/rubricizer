function onOpen() {
	const ui = SpreadsheetApp.getUi();

	ui.createMenu('Rubricizer')
		.addItem('Generate Summary Rubric', 'gsHookGenerateRubric')
		.addItem('Generate PDF', 'gsHookGeneratePDFs')
		.addToUi();
}
