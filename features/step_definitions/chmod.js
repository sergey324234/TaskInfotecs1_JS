

const {Given, When, Then, Before, After} = require('@cucumber/cucumber');


const assert = require('assert');
const fs = require('fs')
const promisify = require('util').promisify;


const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const exec = require('child_process').exec;
const execPromise = promisify(exec);

    
const chalk = require('chalk');

Before(async function (scenario) {
    // Имя сценария
    this.scenarioName = scenario.pickle.name;
    this.targetFile = "test.txt"

    await writeFileAsync(this.targetFile, '123');
});

Given('существует файл с правами {string}', async function(mode) {

    await execPromise(`chmod ${mode} ${this.targetFile}`);
});

When(/^я меняю права этого объекта на (.*)$/, async function(mode) {

    try {
        const {stdout, stderr} = await execPromise(`chmod ${mode} ${this.targetFile}`);

        this.result = {stdout, stderr, error: null} 
    }
    catch(e) {
        this.result = { error: e.message };
    }
    
})



Then('сравниваем результат с {string}', async function (answerMode) {

    const isError = this.result.error !== null;
    const isExpectedError = answerMode === "error";

    if (isError && isExpectedError) {
        console.log(chalk.yellow(`\n[ERROR] [${this.scenarioName}] предвиденная ошибка:\n${this.result.error}`));
        return;
    }

    if (isError || isExpectedError) {
        throw new Error(`[ERROR] [${this.scenarioName}] Непредвиденная ошибка:\n${this.result.error}`);
    }

    const stats = fs.statSync(this.targetFile);
    const actualMode = (stats.mode & 0o7777).toString(8);

    const expectedMode = parseInt(answerMode, 8).toString(8);

    if(actualMode === expectedMode) {
        console.log(chalk.green(`\n[OK] [${this.scenarioName}] Права совпадают!`))
        return;
    }

    throw new Error(`[ERROR] [${this.scenarioName}]\nТекущие права: (${actualMode}) не совпадают с ожидаемыми: (${expectedMode})`);

});



After(async function () {


    await unlinkAsync(this.targetFile);
    

})


