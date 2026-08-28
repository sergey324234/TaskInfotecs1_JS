import { Given, When, Then, Before, After } from '@cucumber/cucumber'

import { expect } from 'bun:test'
import { $ } from 'bun'


import fs from 'fs/promises'
import path from 'path'


import os from 'os'



Before(async function (scenario) {
    
    this.scenarioName = scenario.pickle.name;
    this.mode = ""

    this.targetFile = path.join(os.tmpdir(), `test.txt`);
    await Bun.write(this.targetFile, '123');
})

Given('существует файл с правами {string}', async function(mode) {

    await $`chmod ${mode} ${this.targetFile}`;
})

When("установлен символьный режим {string}", async function(SymbolMode) {

    this.mode += SymbolMode;
    
})

When("я меняю права этого объекта на {string}", async function(mode) {

    this.mode += mode;
    const proc = await $`chmod ${this.mode} ${this.targetFile}`.quiet().nothrow();

    this.result = {
        error: proc.exitCode ? proc.stderr.toString() : null
    }
    
})



Then('сравниваем результат с {string}', async function (answerMode) {

    const isError = this.result.error !== null;
    const isExpectedError = answerMode === "error";

    if (isError && isExpectedError) {
        return;
    }

    if (isError || isExpectedError) {
        throw new Error(`[${this.scenarioName}] непредвиденная ошибка:\n${this.result.error}`);
    }

    const stats = await fs.stat(this.targetFile);
    const actualMode = (stats.mode & 0o7777).toString(8);

    const expectedMode = parseInt(answerMode, 8).toString(8);
    
    expect(actualMode).toBe(expectedMode);

});



After(async function () {


    await fs.chmod(this.targetFile, 0o777);
    await fs.unlink(this.targetFile);
    
})


