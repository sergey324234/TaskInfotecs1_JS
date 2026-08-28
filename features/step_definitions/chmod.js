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

Given('существуют файлы с правами {string}', async function(rawInput) {
    const pairs = rawInput.split(',').map(s => s.trim()).filter(Boolean);
    this.targetObj = [];

    for (const pair of pairs) {
        const lastSpace = pair.lastIndexOf(' ');
        let fileName = 'test.txt';
        let mode = pair;

        if (lastSpace !== -1) {
            fileName = pair.slice(0, lastSpace).trim();
            mode = pair.slice(lastSpace + 1).trim();
        }

        const fullPath = path.join(process.cwd(), fileName);

        await Bun.write(fullPath, '123');
        await $`chmod ${mode} ${fullPath}`.quiet();
        this.targetObj.push(fullPath);
    }

});


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

Then('проверяем кластер файлов и папок на наличие новых прав', async function() {
    const glob = new Bun.Glob("**/*");


    for (const file of glob.scanSync({ cwd: this.targetObj , onlyFiles: false })) {
        
        const fullPath = path.join(this.targetObj, file);
        await ExpectMode(fullPath, this.newMode);
    }

})

Then('сравнить {int} объект из списка существующих на равенство прав со всеми остальными', async function(index1) {


    const stats = await fs.stat(this.targetObj[index1-1]);
    const answerMode = (stats.mode & 0o7777).toString(8);

    for (const file of this.targetObj) {
        
        await ExpectMode(file, answerMode);
    }

})



After(async function () {
    
    await $`chmod 777 ${this.targetObj}`.quiet();
    await $`rm -rf ${this.targetObj}`.quiet();
})


