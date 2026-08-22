const {Given, When, Then, Before, After} = require('@cucumber/cucumber');


const assert = require('assert');
const fs = require('fs')
const { promisify} = require('util');

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const exec = require('child_process').exec;
const execPromise = promisify(exec);






Given('существует файл {string} с правами {int}', async function(filename, mode) {
    this.targetFile = filename;

    await writeFileAsync(filename, '213');
    await execPromise(`chmod ${mode.toString(8)} ${filename}`);
});

When('выполняется команда {string}', async function(command) {
    try {
        const {stdout, stderr} = await execPromise(command, {shell: true})
        this.result = {stdout, stderr, code:0};

    }
    catch (e) {
        this.result = {
            stdout: error.stdout || '',
            stderr: error.stderr || '', 
            code: error.code || 1,
        };
    }
})

Then('код возврата должен быть {int}', function (expectedCode) {
    assert.strictEqual(this.result.code, expectedCode);
});


After(async function () {
    await unlinkAsync(this.targetFile);
})