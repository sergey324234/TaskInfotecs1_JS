

const {Given, When, Then, Before, After} = require('@cucumber/cucumber');


const assert = require('assert');
const fs = require('fs')
const promisify = require('util').promisify;


const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const exec = require('child_process').exec;
const execPromise = promisify(exec);


const chalk = require('chalk');



Given('существует объект {string} с правами {string}', async function(nameobj, mode) {
    this.targetObj = nameobj;
    this.oldMode = mode;

    await writeFileAsync(this.targetObj, '123');
    await execPromise(`chmod ${this.oldMode} ${this.targetObj}`);
});

When('я меняю права этого файла на {string}', async function(mode) {

    this.newMode = mode;
    try {
        const {stdout, stderr} = await execPromise(`chmod ${this.newMode} ${this.targetObj}`);

        this.result = {stdout, stderr, error: null} 
    }
    catch(e) {
        this.result = { error: e.message };
    }
    
})



Then('сравниваем результат с {string}', async function (answerMode) {

    if (answerMode === "error") {
        if (this.result.error !== null) {
            console.log(chalk.green(`\n[Ok] предвиденная ошибка:\n${this.result.error}`));
            return;
        }
        throw new Error(`Ожидалась ошибка при chmod ${this.newMode}, но команда прошла успешно.`);
    }

    const stats = fs.statSync(this.targetObj);
    const actualMode = (stats.mode & 0o7777).toString(8);

    const expectedMode = parseInt(answerMode, 8).toString(8);

    if(actualMode === expectedMode) {
        console.log(chalk.green(`\n[Ok] Права совпадают!`))
        return;
    }

    throw new Error(`Текущие права (${actualMode}) не совпадают с ожидаемыми (${expectedMode})`);

});



After(async function () {

    if (this.targetObj && fs.existsSync(this.targetObj)) {
        await unlinkAsync(this.targetObj);
    }
})


