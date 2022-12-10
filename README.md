# Rubricizer

## What Is This

* This is for automating the rubric-making boilerplate for the teachers.
* My client is Rob, but this could be used by any of the teachers.
* Both rubric generation and rubric exporting are functional, although the formatting left by the rubric generator is fairly barebones and needs to be improved.

### Explicitly Defining Words I Use Too Often

* "Tab" is equivalent with "Sheet".
* "Newbric" is what the teachers are calling the new rubric format (the ones with 0-4 in place of colored rubric boxes).
* "Raw Canvas Export" refers to the .csv (imported into a new sheet in the rubric GSheet) downloaded from Canvas.
* "Gradebook" refers to either the Canvas view, or the tab in the GSheet (typically the latter unless mentioned otherwise). It contains grades for each student in a table format.
* "Rubric tab" or "Rubric template" refers to the tab in the GSheet. By selecting a number from the dropdown in the upper right corner, it autofills information from the Gradebook into a rubric format.

## Setup

**DISCLAIMER:** The wiki and setup sections have been made somewhat outdated by recent changes to the rubric generator. Updated documentation currently in the works.

* Get a copy of the Intro to Fab Rubric Template via the sharelink (Wiki → Materials).
* It'll have a Rubric template & gradebook w/ dummy students (yes I made those names up). If you plan on working on the Reformatter, you'll have to Import → "Import as new sheet(s)" the raw canvas export csv.
* If the GSheet doesn't have it already, get the contents of the .gs file into a container-ed Google Apps Script (go to Wiki → Materials → teacher_instructions.pdf).
* Instructions on how to import/export Apps Script files local ↔ GDrive, if you'd like to do that: https://developers.google.com/apps-script/guides/import-export.
