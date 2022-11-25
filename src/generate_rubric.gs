const RubricGenerator = (function () {
	//> CSV Helpers
	function parseCSV(file) {
		// Normalize CRLF to LF
		file = file.replace(/\r\n/g, "\n");

		// Parse CSV file
		const rows = [];
		let head = 0;

		while (file[head] !== undefined) {
			const row = [];

			// Parse CSV line
			while (true) {
				// Check whether we're terminating the line
				if (file[head] === undefined) {
					break;
				}

				if (file[head] === "\n") {
					head += 1;
					break;
				}

				// Expect "," if this is not the first cell on the line
				if (row.length > 0) {
					if (file[head] !== ",") {
						throw "Encountered undelimited string literal.";
					}

					head += 1;
				}

				// Parse quoted CSV cell
				if (file[head] === "\"") {
					head += 1;

					let builder = "";

					while (true) {
						// Error on EOF
						if (file[head] === undefined) {
							throw "Encountered unterminated string literal.";
						}

						// Search for quote
						if (file[head] === "\"") {
							head += 1;

							if (file[head] === "\"") {
								// Treat as an escape if two quotes are specified back to back.
								// (fallthrough)
							} else {
								// Otherwise, treat it as a terminator.
								break;
							}
						}

						// Parse regular character
						builder += file[head++];
					}

					row.push(builder);
					continue;
				}

				// Parse naked CSV cell
				let builder = "";

				while (true) {
					// Stop on delimiter
					if (file[head] === undefined || file[head] === "\n" || file[head] === ",") {
						break;
					}

					builder += file[head++];
				}

				row.push(builder);
			}

			// Ignore lines without explicit cells
			if (row.length === 0) {
				continue;
			}

			// Ensure that all rows have the same length
			if (rows.length > 0 && rows[0].length !== row.length) {
				throw "Rows must have the same length.";
			}

			// Commit the row
			rows.push(row);
		}

		return rows;
	}

	class CsvBuilder {
		constructor() {
			this.builder = "";
		}

		pushRow() {
			this.builder += "\n";
		}

		pushCell(value) {
			this.builder += `"${value.replace(/"/g, '""')}",`;
		}
	}

	//> Table Building Helpers
	function codeToChar(i) {
		return String.fromCharCode(i);
	}

	function charToCode(c) {
		return c.charCodeAt(0);
	}

	function roundNum(num, digits) {
		const mul = 10 ** digits;
		return Math.round(num * mul) / mul;
	}

	function colFormulaName(row) {
		const A = charToCode("A");
		let builder = "";

		row += 1;

		while (row > 0) {
			let cc = A + (row % 26);

			if (row < 25) {
				cc -= 1;
			}

			builder = codeToChar(cc) + builder;
			row = Math.floor(row / 26);
		}

		return builder;
	}

	class CellRef {
		constructor(row, col, sheet = null) {
			this.row_ = row;
			this.col_ = col;
			this.sheet = sheet;
		}

		//> Property re-exports
		get row() {
			return this.row_;
		}

		get col() {
			return this.col_;
		}

		//> Relational operators
		at(row, col) {
			return new CellRef(row, col, this.sheet);
		}

		offset(row_delta, col_delta) {
			return new CellRef(
				this.row === null ? null : this.row + row_delta,
				this.col === null ? null : this.col + col_delta,
				this.sheet,
			);
		}

		above() {
			return this.offset(-1, 0);
		}

		below() {
			return this.offset(1, 0);
		}

		//> Representational Conversions
		get map_key() {
			return `${this.row},${this.col}`;
		}

		get sheet_prefix() {
			return this.sheet !== null ? `${this.sheet}!` : "";
		}

		get col_name() {
			return `$${colFormulaName(this.col)}`;
		}

		get row_name() {
			return `$${this.row + 1}`;
		}

		get formula() {
			return `${this.sheet_prefix}${this.col_name}${this.row_name}`;
		}

		get unbounded_col() {
			return `${this.sheet_prefix}${this.col_name}:${this.col_name}`;
		}

		get unbounded_row() {
			return `${this.sheet_prefix}${this.row_name}:${this.row_name}`;
		}

		toString() {
			return this.formula;
		}
	}

	class TableBuilder {
		constructor() {
			this.aabb = new CellRef(0, 0);
			this.cells = new Map();
		}

		get(pos) {
			return this.cells.get(pos.map_key);
		}

		set(pos, content) {
			// Grow AABB
			this.aabb = this.aabb.at(
				Math.max(this.aabb.row, pos.row),
				Math.max(this.aabb.col, pos.col),
			);

			// Set cell
			const key = pos.map_key;
			if (this.cells.has(key)) {
				throw `Cell at ${pos} already has a value.`;
			}
			this.cells.set(key, content);
		}

		asCSV() {
			const builder = new CsvBuilder();

			for (let row = 0; row <= this.aabb.row; row++) {
				for (let col = 0; col <= this.aabb.col; col++) {
					const cell = this.get(new CellRef(row, col));
					builder.pushCell(cell !== undefined ? cell : "");
				}
				builder.pushRow();
			}

			return builder.builder;
		}

		writeToSheet(sheet) {
			for (let row = 0; row <= this.aabb.row; row++) {
				const row_value = [];
				for (let col = 0; col <= this.aabb.col; col++) {
					const cell_value = this.get(new CellRef(row, col));
					row_value.push(cell_value !== undefined ? cell_value : "");
				}

				sheet.appendRow(row_value);
			}
		}
	}

	//> Rubric Header Parser
	class Rubric {
		constructor(sheet_name, headings) {
			this.sheet_name = sheet_name;

			// Validate headings and extract objectives paths
			const objective_paths = [];
			{
				let head = 0;

				// Validate required fields
				if (headings[head++] !== "Student name" || headings[head++] !== "Student ID") {
					throw "Missing student name or student ID column.";
				}

				// Validate and extract content objectives
				while (head < headings.length) {
					//> Parse path

					// Extract result header
					let result_header = headings[head++];

					// Extract mastery header
					if (head >= headings.length) {
						throw "Missing corresponding mastery header.";
					}
					let mastery_header = headings[head++];

					// Extract path from result header.
					// Format: `<SOF>(path > to > blah) result<EOF>`
					result_header = result_header.match(/^([^]*) result$/);
					if (result_header === null) {
						throw "Missing result column.";
					}
					const [_, objective_path_str] = result_header;

					// Ensure that the mastery header is of the form:
					// `<SOF><objective_path_str> mastery points<EOF>`
					if (
						!mastery_header.startsWith(objective_path_str) ||
						mastery_header.substring(objective_path_str.length) !== " mastery points"
					) {
						throw "Missing corresponding mastery points column for result column.";
					}

					// Extract standard path parts, stripping any Canvas-added formatting.
					objective_paths.push(objective_path_str.split(" > "));
				}
			}

			// Extract objective tree
			this.root_objective = new Objective("default root");

			for (let objective_index = 0; objective_index < objective_paths.length; objective_index++) {
				const objective_path = objective_paths[objective_index];
				let target = this.root_objective;

				for (const part of objective_path) {
					target = target.getOrCreateChild(part);
				}

				target.assignColumn(objective_index, sheet_name);
			}

			// Collapse the first parent if it only has a single child.
			if (this.root_objective.children.length === 1) {
				this.root_objective = this.root_objective.children[0];
			}

			// Extract header names
			this.name_column = new CellRef(null, 0, sheet_name);
			this.id_column = new CellRef(null, 1, sheet_name);
		}
	}

	class Objective {
		constructor(name) {
			this.name = name;
			this.children = [];
			this.name_to_index = new Map();
			this.value_column = null;
			this.points_column = null;
		}

		assignColumn(col, sheet_name) {
			if (this.value_column !== null) {
				throw "Assigned column to specified `Objective` more than once.";
			}
			this.value_column = new CellRef(null, 2 + 2 * col, sheet_name);
			this.points_column = new CellRef(null, 3 + 2 * col, sheet_name);
		}

		getOrCreateChild(name) {
			let child_index = this.name_to_index.get(name);

			if (child_index === undefined) {
				child_index = this.children.length;

				this.children.push(new Objective(name));
				this.name_to_index.set(name, child_index);
			}

			return this.children[child_index];
		}

		getChild(name) {
			const child_index = this.name_to_index.get(name);
			return child_index !== undefined ?
				this.children[child_index] :
				null;
		}

		getChildByPath(parts) {
			let target = this;

			for (const part of parts) {
				target = target.getChild(part);
				if (target === null) {
					throw `unknown child with name "${part}"`;
				}
			}

			return target;
		}
	}

	//> Builder
	const DEFAULT_MASTERY_EXPLANATIONS = `\
	Learning standard mastery levels:
	4* - (Commendation) Student work shows evidence of especially sophisticated, nuanced, or analytical thinking. 
	4 - (Mastery) Student demonstrates mastery of the standards assessed. 
	3 - (Partial mastery) Student demonstrates partial mastery of the standards assessed.
	2 - (Emerging understanding) Student demonstrates an emerging understanding of the standards assessed.
	1 - (Insufficient evidence) Student has submitted insufficient evidence for the standards assessed.\
	`;

	function buildSummary(rubric) {
		const table = new TableBuilder();

		// Define lookup mechanism
		const sid_cell = new CellRef(0, 0);

		function makeLookupFormula(target_column) {
			return `=LOOKUP(${sid_cell.formula}, ${rubric.id_column.unbounded_col}, ${target_column.unbounded_col})`;
		}

		// Write header
		let head = sid_cell.offset(0, 1);

		table.set(sid_cell, "1");
		table.set(head.offset(0, 0), makeLookupFormula(rubric.name_column));
		table.set(head.offset(0, 3), "Course grade:");
		table.set(head.offset(0, 4), "(define a grading formula here)");
		head = head.below();

		table.set(head, "Enter Course Name Here");
		head = head.below();

		table.set(head, DEFAULT_MASTERY_EXPLANATIONS);
		head = head.below();

		// Write mastery level summaries
		const categories = rubric.root_objective.children;
		const category_avg_cells = [];
		{
			let average_formula_builder = "=";

			// Write out category averages
			for (let i = 0; i < categories.length; i++) {
				const category = categories[i];

				// Determine cell locations
				const summary_cell = head;
				const average_cell = head.offset(0, 2);
				head = head.below();

				// Keep track of the average cell to fill in later
				category_avg_cells.push(average_cell);

				// Write average header
				table.set(summary_cell, `${category.name} Avg (${roundNum(100 / categories.length, 2)}% weight)`);

				// Build global average formula
				if (i > 0) {
					average_formula_builder += "+";
				}
				average_formula_builder += `REGEXEXTRACT(${summary_cell.formula},".*\\(([\\d.]+)% weight\\)")/100*${average_cell.formula}`;
			}

			// Write out total mastery level average
			table.set(head, "Average Mastery Level");
			table.set(head.offset(0, 2), average_formula_builder);
			head = head.below();
		}

		// Write out score tree
		function writeTree(node) {
			if (node.value_column !== null) {
				// Treat node as leaf
				table.set(head, makeLookupFormula(node.value_column));
				table.set(head.offset(0, 1), node.name);
				head = head.below();
			} else {
				// Treat node as header
				table.set(head, node.name);
				head = head.below();

				for (const child of node.children) {
					writeTree(child);
				}
			}
		}

		for (let i = 0; i < categories.length; i++) {
			const start = head;
			writeTree(categories[i]);
			const end = head.above();

			table.set(category_avg_cells[i], `=AVERAGE(${start.formula}:${end.formula})`);
		}

		return table;
	}

	return { parseCSV, Rubric, buildSummary };
}());

//> Local Testing Logic
if (false) {
	const fs = require("fs");
	const csv = RubricGenerator.parseCSV(fs.readFileSync("input.csv", "UTF-8"));
	const rubric = new RubricGenerator.Rubric("Grades", csv[0]);
	const table = RubricGenerator.buildSummary(rubric);
	fs.writeFileSync("output.csv", table.asCSV());
}

//> GScript logic
function gsHookGenerateRubric() {
	// Obtain the active sheet and validate it.
	const doc = SpreadsheetApp.getActive();
	const input_sheet = SpreadsheetApp.getActiveSheet();

	if (doc === null || input_sheet === null) {
		throw "No active spreadsheet.";
	}

	// Import Canvas Rubric
	input_sheet.setName("Gradebook");
	const input_sheet_data = input_sheet.getDataRange();
	const input_sheet_data_raw = input_sheet_data.getValues();
	const rubric = new RubricGenerator.Rubric(
		input_sheet.getName(),
		input_sheet_data_raw[0].map(col => col.toString()),
	);

	// Generate output
	const table = RubricGenerator.buildSummary(rubric);
	const output_sheet = doc.insertSheet();
	output_sheet.setName("Summary Rubric");
	table.writeToSheet(output_sheet);
}
