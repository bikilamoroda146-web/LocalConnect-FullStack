import { randomBytes } from 'node:crypto'
import { EventEmitter } from 'node:events'
import { describe, expect, it } from 'vitest'
import { askHidden } from '../../scripts/provision-admin-production.js'

class FakeInput extends EventEmitter {
  isTTY = true
  modes = []

  setRawMode(enabled) {
    this.modes.push(enabled)
  }

  resume() {}
  pause() {}
}

class FakeOutput {
  writes = []

  write(value) {
    this.writes.push(value)
  }
}

describe('hidden administrator password prompt', () => {
  it('does not echo password characters and restores terminal mode on submit', async () => {
    const input = new FakeInput()
    const output = new FakeOutput()
    const password = randomBytes(24).toString('base64url')
    const pending = askHidden('Password: ', input, output)

    input.emit('data', password)
    input.emit('data', '\r')

    await expect(pending).resolves.toBe(password)
    expect(output.writes).toEqual(['Password: ', '\n'])
    expect(input.modes).toEqual([true, false])
  })

  it('restores terminal mode and rejects when interrupted with Ctrl+C', async () => {
    const input = new FakeInput()
    const output = new FakeOutput()
    const pending = askHidden('Password: ', input, output)

    input.emit('data', '\u0003')

    await expect(pending).rejects.toMatchObject({ code: 'CANCELLED' })
    expect(input.modes).toEqual([true, false])
    expect(output.writes).toEqual(['Password: '])
  })
})
