import { exec } from 'child_process'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { promisify } from 'util'

const execAsync = promisify(exec)

const videoToGif = async (data: Buffer): Promise<Buffer> => {
    const filename = `${tmpdir()}/${Math.random().toString(36)}`
    const video = `${filename}.video`
    const gif = `${filename}.gif`

    await writeFile(video, data)

    try {
        await execAsync(`ffmpeg -i "${video}" "${gif}"`)
        return await readFile(gif)
    } finally {
        await Promise.allSettled([unlink(video), unlink(gif)])
    }
}

export default videoToGif
