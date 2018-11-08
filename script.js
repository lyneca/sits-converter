const fs = require('fs');
const csv = require('csvtojson');
const excel = require('node-excel-export');

var csvFile;
var sitsFile;

function getGrade(mark) {
    if (mark < 50) return "FA";
    if (mark < 65) return "PA";
    if (mark < 75) return "CR";
    if (mark < 85) return "DI";
    return "HD"
}

function getName(name) {
    return name.replace(',', '').toUpperCase();
}

function process() {
    csv()
        .fromFile(csvFile.path)
        .then((jsonObj) => {
            jsonObj.shift();
            console.log(jsonObj);
            jsonObj = jsonObj.filter((student) => {
                return student["SIS User ID"] != "";
            });
            const output = excel.buildExport(
                [
                    {
                        specification: {
                            student_id: {
                                displayName: "Student ID",
                                headerStyle: {},
                                width: 120
                            },
                            name: {
                                displayName: "Name",
                                headerStyle: {},
                                width: 120
                            },
                            grade: {
                                displayName: "Grade",
                                headerStyle: {},
                                width: 120
                            },
                            mark: {
                                displayName: "Mark",
                                headerStyle: {},
                                width: 120
                            },
                        },
                        data: jsonObj.map((val) => {
                            return {
                                student_id: parseInt(val["SIS User ID"]),
                                grade: getGrade(val["Final Score"]),
                                name: getName(val["Student"]),
                                mark: parseFloat(val["Final Score"])
                            }
                        })
                    }
                ]
            );
            fs.writeFile("/Users/tut012/Documents/git/sits-converter/output.xlsx", output, (err) => {
                if (err) throw err;
                console.log("Saved as ~/output.xlsx");
            });
        });
}