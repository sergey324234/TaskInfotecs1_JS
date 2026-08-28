import { Given, When, Then, Before, After } from '@cucumber/cucumber'

import { expect } from 'bun:test'
import { $ } from 'bun'


import fs from 'fs/promises'
import path from 'path'




Before(async function (scenario) {
    this.scenarioName = scenario.pickle.name;

    this.newMode = "";
    this.option = "";

})

Given('существует файл с правами {string}', async function(mode) {

    this.targetObj = path.join(process.cwd(), `test.txt`);
    await Bun.write(this.targetObj, '123');

    //this.targetObj = path.join(rootDir, 'FileTest.txt');
    await $`chmod ${mode} ${this.targetObj}`;
    
})

Given('существует кластер файлов и папок с правами {string}', async function(mode) {

    this.targetObj = path.join(process.cwd(), 'DirTest');

    const rootFile = path.join(this.targetObj, 'FileTest.txt');
    const dir1 = path.join(this.targetObj, 'DirTest1');
    const file2 = path.join(this.targetObj, 'DirTest2', 'FileTest2.txt');


    await fs.mkdir(dir1, { recursive: true });
    await Bun.write(rootFile, '123');
    await Bun.write(file2, '123');

    await $`chmod -R ${mode} ${this.targetObj}`;
})


When("установлена опция {string}", async function(option) {
    this.option = option;
})

When("установлен символьный режим {string}", async function(symbolMode) {

    this.newMode += symbolMode;
    
})

When("я меняю права этого объекта на {string}", async function(mode) {

    this.newMode += mode;
    const args = [this.option, this.newMode, this.targetObj].filter(Boolean);

    const proc = await $`chmod ${args}`.quiet().nothrow();

    this.result = {
        error: proc.exitCode ? proc.stderr.toString() : null
    }
    
})


async function ExpectMode(obj ,answerMode) {

    const stats = await fs.stat(obj);
    const actualMode = (stats.mode & 0o7777).toString(8);

    const expectedMode = parseInt(answerMode, 8).toString(8);
    
    expect(actualMode).toBe(expectedMode);
}

Then('сравниваем результат с {string}', async function (answerMode) {

    const isError = this.result.error !== null;
    const isExpectedError = answerMode === "error";

    if (isError && isExpectedError) {
        return;
    }

    if (isError || isExpectedError) {
        throw new Error(`[${this.scenarioName}] непредвиденная ошибка:\n${this.result.error}`);
    }

    await ExpectMode(this.targetObj, answerMode);

});

Then('проверяем кластер файлов на наличие новых прав', async function() {
    const glob = new Bun.Glob("**/*");


    for (const file of glob.scanSync({ cwd: this.targetObj , onlyFiles: false })) {
        
        const fullPath = path.join(this.targetObj, file);
        await ExpectMode(fullPath, this.newMode);
    }


})



After(async function () {
    
    await fs.chmod(this.targetObj, 0o777);
    await fs.rm(this.targetObj, { recursive: true, force: true });
    
})


