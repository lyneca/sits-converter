const fs = require('fs');
const csv = require('csvtojson');
const excel = require('node-excel-export');
var readXlsxFile = require('read-excel-file/node');

var csvFile;
var sitsFile;

function getGrade(mark) {
    if (mark < 50) return "FA";
    if (mark < 65) return "PA";
    if (mark < 75) return "CR";
    if (mark < 85) return "DI";
    return "HD"
}

function disableStep(step) {
    var stepElement = document.getElementById("step-" + step);
    stepElement.classList.add("disabled");
}

function enableStep(step) {
    var stepElement = document.getElementById("step-" + step);
    stepElement.classList.remove("disabled");
    console.log(step);
    if (step < 3) stepElement.children[1].children[0].children[0].textContent = "Drag the file straight into this box"
}

function getName(name) {
    return name.replace(',', '').toUpperCase();
}

function readCSV(path) {
    return csv().fromFile(path);
}

function readXLSX(path) {
    return readXlsxFile(path);
}

function process(csvFile, sitsFile) {
    if (!csvFile.endsWith('.csv'));
    readCSV(csvFile).then((jsonObj) => {
        jsonObj.shift();
        jsonObj = jsonObj.filter((student) => {
            return student["SIS User ID"] != "";
        });
        readXLSX(sitsFile).then((excelLines) => {
            excelLines.shift();
            output = exportXSLX(combine(jsonObj, excelLines));
            var outputPath = dialog.showSaveDialog({
                filters: [
                    { name: 'Excel Spreadsheets', extensions: ['xlsx'] }
                ],
            });
            if (!outputPath) return;
            fs.writeFile(outputPath, output, (err) => {
                if (err) throw err;
            });
        })
    });
}

function combine(csv, sits) {
    var keyedCSV = {};
    sits.forEach((val) => {
        var sid = val[13];
        keyedCSV[sid] = {};
        keyedCSV[sid].year = val[0];
        keyedCSV[sid].period = val[1];
        keyedCSV[sid].uos = val[2];
        keyedCSV[sid].occ = val[3];
        keyedCSV[sid].map = val[4];
        keyedCSV[sid].ass = val[5];
        keyedCSV[sid].cand_key = val[6];
        keyedCSV[sid].name = val[7];
        keyedCSV[sid].hash_cd = val[8];
        keyedCSV[sid].mark = val[9];
        keyedCSV[sid].grade = val[10];
        keyedCSV[sid].cd = val[11];
        keyedCSV[sid].cand_key_2 = val[12];
        keyedCSV[sid].student_id = val[13];
        keyedCSV[sid].first_name = val[14];
        keyedCSV[sid].second_name = val[15];
        keyedCSV[sid].surname = val[16];
        keyedCSV[sid].uos = val[17];
        keyedCSV[sid].assessment_type = val[18];
        keyedCSV[sid].mark_scheme = val[19];
    });
    csv.forEach((val) => {
        var sid = val["SIS User ID"];
        keyedCSV[sid].grade = getGrade(val["Final Score"]);
        keyedCSV[sid].mark = parseFloat(val["Final Score"]);
    });
    return keyedCSV;
}

function exportXSLX(combinedJSON) {
    return excel.buildExport([{
        specification: specification,
        data: Object.values(combinedJSON)
    }]);
}

const specification = {
    year: {
        displayName: "Year",
        headerStyle: {},
        width: 120
    },
    period: {
        displayName: "Period",
        headerStyle: {},
        width: 120
    },
    uos: {
        displayName: "#UoS",
        headerStyle: {},
        width: 120
    },
    occ: {
        displayName: "Occ",
        headerStyle: {},
        width: 120
    },
    map: {
        displayName: "#Map",
        headerStyle: {},
        width: 120
    },
    ass: {
        displayName: "#Ass#",
        headerStyle: {},
        width: 120
    },
    cand_key: {
        displayName: "#Cand Key",
        headerStyle: {},
        width: 120
    },
    name: {
        displayName: "Name",
        headerStyle: {},
        width: 120
    },
    hash_cd: {
        displayName: "#CD",
        headerStyle: {},
        width: 120
    },
    mark: {
        displayName: "Mark",
        headerStyle: {},
        width: 120
    },
    grade: {
        displayName: "Grade",
        headerStyle: {},
        width: 120
    },
    cd: {
        displayName: "CD",
        headerStyle: {},
        width: 120
    },
    cand_key_2: {
        displayName: "#Cand Key",
        headerStyle: {},
        width: 120
    },
    student_id: {
        displayName: "Student ID",
        headerStyle: {},
        width: 120
    },
    first_name: {
        displayName: "First Name",
        headerStyle: {},
        width: 120
    },
    second_name: {
        displayName: "Second Name",
        headerStyle: {},
        width: 120
    },
    surname: {
        displayName: "Surname",
        headerStyle: {},
        width: 120
    },
    uos_name: {
        displayName: "UOS Name",
        headerStyle: {},
        width: 120
    },
    assessment_type: {
        displayName: "Assessment type",
        headerStyle: {},
        width: 120
    },
    mark_scheme: {
        displayName: "Mark scheme",
        headerStyle: {},
        width: 120
    },
}