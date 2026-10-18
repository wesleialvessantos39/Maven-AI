import {test} from 'node:test';import{strict as assert}from'node:assert';import{validateTask}from'../api/tasks.js';
test('valida tarefa',()=>{assert.equal(validateTask('  exemplo '),'exemplo');assert.throws(()=>validateTask('x'));});
