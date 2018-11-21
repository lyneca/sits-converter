const fs = require('fs');
const csv = require('csvtojson');
const excel = require('node-excel-export');
const xlsx = require('xlsx');
var readXlsxFile = require('read-excel-file/node');

var csvFile;
var sitsFile;

function getGrade(mark) {
    if (mark < 50) return "";
    if (mark < 65) return "PS";
    if (mark < 75) return "CR";
    if (mark < 85) return "DI";
    return "HD"
}

function resetBox(box) {
        box.classList.remove('error');
        box.children[0].children[0].src = "upload.png"
        box.children[0].children[1].textContent = "Drag the file straight into this box";
        box.children[0].children[2].textContent = "No file uploaded";
}

function disableStep(step) {
    var stepElement = document.getElementById("step-" + step);
    if (step < 3) {
        resetBox(stepElement.children[1]);
    }
    stepElement.classList.add("disabled");
}

function enableStep(step) {
    var stepElement = document.getElementById("step-" + step);
    stepElement.classList.remove("disabled");
    if (step < 3) stepElement.children[1].children[0].children[1].textContent = "Drag the file straight into this box"
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
    readCSV(csvFile).then((jsonObj) => {
        if (Object.keys(jsonObj[0]).indexOf("SIS User ID") < 0) {
            flashErrorTooltip(csvInput.children[1], "Invalid CSV File (missing SIS User ID column)");
            reset();
            return;
        }
        if (Object.keys(jsonObj[0]).indexOf("Final Score") < 0) {
            flashErrorTooltip(csvInput.children[1], "Invalid CSV File (missing Final Score column)");
            reset();
            return;
        }
        jsonObj.shift();
        jsonObj = jsonObj.filter((student) => {
            return student["SIS User ID"] != "";
        });
        readXLSX(sitsFile).then((excelLines) => {
            if (JSON.stringify(excelLines[0]) != JSON.stringify(column_names)) {
                var error = "Invalid SITS file";
                if (column_names.length != excelLines[0].length)
                    error = "Invalid SITS file: incorrect number of columns";
                flashErrorTooltip(sitsInput.children[1], error);
                disableStep(3);
                resetBox(sitsInput);
                sitsInput.classList.remove("uploaded");
                return;
            }
            excelLines.shift();
            var combined = combine(jsonObj, excelLines);
            output_csv = exportCSV(combined);
            output_xlsx = exportXSLX(combined);
            var outputPath = dialog.showSaveDialog({
                filters: [
                    { name: 'CSV Files', extensions: ['csv'] }
                ],
            });
            if (!outputPath) return;
            fs.writeFile(outputPath, output_csv, (err) => {
                if (err) throw err;
            });
            var xlsxFile = outputPath.split('.').slice(0, -1).join('.') + '-DISPLAY.xlsx';
            xlsx.writeFile(output_xlsx, xlsxFile);
            reset();
        });
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
        keyedCSV[sid].grade = getGrade(Math.round(val["Final Score"]));
        keyedCSV[sid].mark = Math.round(parseFloat(val["Final Score"]));
    });
    return keyedCSV;
}

function exportCSV(combinedJSON) {
    var csv = [];
    csv.push(columns.map(a => specification[a].displayName).map(a => /,/.test(a) ? '"' + a + '"' : a));
    Object.values(combinedJSON).forEach(item => {
        var row = [];
        columns.forEach(col => {
            row.push(/,/.test(item[col]) ? '"' + item[col] + '"' : item[col]);
        });
        csv.push(row);
    });
    return csv.join('\n');
}

function exportXSLX(combinedJSON) {
    var excel_file = excel.buildExport([{
        specification: specification,
        data: Object.values(combinedJSON)
    }]);
    var workbook = xlsx.read(excel_file);
    var worksheet = workbook.Sheets[workbook.SheetNames[0]];
    worksheet['!ref'] = worksheet['!ref'].replace('T', 'AA');
    worksheet['V1'] = { t: 's', v: 'Grade' };
    worksheet['V2'] = { t: 's', v: 'HD' };
    worksheet['V3'] = { t: 's', v: 'DI' };
    worksheet['V4'] = { t: 's', v: 'CR' };
    worksheet['V5'] = { t: 's', v: 'PS' };
    worksheet['V6'] = { t: 's', v: 'FA' };
    worksheet['V7'] = { t: 's', v: 'AF' };
    worksheet['V8'] = { t: 's', v: 'IC' };
    worksheet['V9'] = { t: 's', v: 'RI' };

    worksheet['W1'] = { t: 's', v: 'Mark' };
    worksheet['W2'] = { t: 's', v: '85-100' };
    worksheet['W3'] = { t: 's', v: '75-84' };
    worksheet['W4'] = { t: 's', v: '65-74' };
    worksheet['W5'] = { t: 's', v: '50-64' };
    worksheet['W6'] = { t: 's', v: '0-49' };
    worksheet['W7'] = { t: 's', v: '0-49' };
    worksheet['W8'] = { t: 's', v: '0-100' };
    worksheet['W9'] = { t: 's', v: '0-100' };

    worksheet['X1'] = { t: 's', v: 'Description' };
    worksheet['X2'] = { t: 's', v: 'High Distinction' };
    worksheet['X3'] = { t: 's', v: 'Distinction' };
    worksheet['X4'] = { t: 's', v: 'Credit' };
    worksheet['X5'] = { t: 's', v: 'Pass' };
    worksheet['X6'] = { t: 's', v: 'Fail' };
    worksheet['X7'] = { t: 's', v: 'Absent Fail' };
    worksheet['X8'] = { t: 's', v: 'Incomplete' };
    worksheet['X9'] = { t: 's', v: 'Long Term Incomplete' };
    worksheet['Y1'] = { t: 's', v: 'Students Receiving Each Grade' };
    worksheet['Y2'] = { f: 'COUNTIF(K:K,V2)' };
    worksheet['Y3'] = { f: 'COUNTIF(K:K,V3)' };
    worksheet['Y4'] = { f: 'COUNTIF(K:K,V4)' };
    worksheet['Y5'] = { f: 'COUNTIF(K:K,V5)' };
    worksheet['Y6'] = { f: 'COUNTIF(K:K,V6)' };
    worksheet['Y7'] = { f: 'COUNTIF(K:K,V7)' };
    worksheet['Y8'] = { f: 'COUNTIF(K:K,V8)' };
    worksheet['Y9'] = { f: 'COUNTIF(K:K,V9)' };

    worksheet['AA1'] = { t: 's', v: 'Percentage' };
    worksheet['AA2'] = { f: 'Y2/SUM($Y$2:$Y$9)', z: '0%' };
    worksheet['AA3'] = { f: 'Y3/SUM($Y$2:$Y$9)', z: '0%' };
    worksheet['AA4'] = { f: 'Y4/SUM($Y$2:$Y$9)', z: '0%' };
    worksheet['AA5'] = { f: 'Y5/SUM($Y$2:$Y$9)', z: '0%' };
    worksheet['AA6'] = { f: 'Y6/SUM($Y$2:$Y$9)', z: '0%' };
    worksheet['AA7'] = { f: 'Y7/SUM($Y$2:$Y$9)', z: '0%' };
    worksheet['AA8'] = { f: 'Y8/SUM($Y$2:$Y$9)', z: '0%' };
    worksheet['AA9'] = { f: 'Y9/SUM($Y$2:$Y$9)', z: '0%' };

    worksheet['X11'] = { t: 's', v: '(all marks)' };
    worksheet['X12'] = { t: 's', v: '(excluding "0" marks)' };
    worksheet['X13'] = { t: 's', v: '(excluding "0" marks)' };

    worksheet['Y11'] = { t: 's', v: 'Mean mark =' };
    worksheet['Y12'] = { t: 's', v: 'Mean mark =' };
    worksheet['Y13'] = { t: 's', v: 'Mean Grade = ' };

    worksheet['Z11'] = { f: 'AVERAGE(J2:J200)' };
    worksheet['Z12'] = { f: 'AVERAGEIF(J1:J199,">0")' };
    worksheet['Z13'] = { t: 's', v: 'Mean Grade = ' };

    worksheet['AA11'] = { f: 'ROUND(Z11,0)' };
    worksheet['AA12'] = { f: 'ROUND(Z12,0)' };
    worksheet['AA13'] = { f: 'IF(AA12>84,"HD",IF(AA12>74,"DI",IF(AA12>64,"CR",IF(AA12>49,"PS",IF(AA12<49,"FA")))))' };


    workbook.Sheets[workbook.SheetNames[0]] = worksheet;

    console.log(workbook);
    return workbook;
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
    }
}

columns = ["year", "period", "uos", "occ", "map", "ass", "cand_key", "name", "hash_cd", "mark", "grade", "cd", "cand_key_2", "student_id", "first_name", "second_name", "surname", "uos", "assessment_type", "mark_scheme"]
column_names = ["Year", "Period", "#UoS", "Occ", "#Map", "#Ass#", "#Cand Key", "Name", "#CD", "Mark", "Grade", "CD", "#Cand Key", "Student ID", "First Name", "Second Name", "Surname", "UOS Name", "Assessment type", "Mark scheme"]