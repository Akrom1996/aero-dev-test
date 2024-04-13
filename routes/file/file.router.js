const express = require('express');
const {
    authenticate
} = require('../../security/authentication');
const {
    pool
} = require('../../utils/connection.db');
const {
    getFile
} = require('../../utils/file.helper')
const fs = require('fs').promises;

const router = express.Router();

/* [POST] - добавление нового файла в систему */
router.post('/upload', authenticate, async (req, res) => {
    try {
        if (!req.files) return res.status(200).json({
            result: 'FILE NOT ATTACHED'
        })
        const file = req.files.file;
        const splittedName = file.name.split('.');
        const fileExtension = splittedName.pop();
        const fileName = splittedName.join('.');
        const [savedFileData] = await pool.query('INSERT INTO FILES (file_name, extension, mime_type, size, user_id) VALUES (?, ? ,? ,?, ?)',
            [fileName, fileExtension, file.mimetype, file.size, res.locals.payload.id]);
        await file.mv(`${__dirname}/${fileName}-${savedFileData.insertId}.${fileExtension}`)
        return res.status(200).json({
            result: savedFileData.insertId
        });
    } catch (error) {
        return res.status(500).json({
            error: error.message
        })
    }
})

/* [DELETE] - удаляет документ из базы и локального Хранилища */
router.delete('/delete/:id', authenticate, async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const fileData = await getFile(id);
        await pool.query('DELETE FROM FILES WHERE id = ?', [id])
        await fs.unlink(`${__dirname}/${fileData.file_name}-${fileData.id}.${fileData.extension}`)
        res.status(200).json({
            result: 'SUCCESS'
        })
    } catch (error) {
        return res.status(500).json({
            error: error.message
        })
    }
})

/* [GET] выводит список файлов и их параметров из базы с использованием пагинации */
router.get('/list', authenticate, async (req, res) => {
    try {
        const page = Number(req.body.page) || 1
        const listSize = Number(req.body.listSize) || 10
        const [files] = await pool.query('SELECT * FROM FILES LIMIT ? OFFSET ?', [listSize, listSize * (page - 1)])
        return res.status(200).json(JSON.parse(JSON.stringify(files)))
    } catch (error) {
        return res.status(500).json({
            error: error.message
        })
    }
})

/* [GET] - вывод информации о выбранном файле */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const fileData = await getFile(id);
        return res.status(200).json(fileData)
    } catch (error) {
        return res.status(500).json({
            error: error.message
        })
    }
})

/* [GET] - скачивание конкретного файла */
router.get('/download/:id', authenticate, async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const fileData = await getFile(id);
        return res.download(`${__dirname}/${fileData.file_name}-${fileData.id}.${fileData.extension}`);
    } catch (error) {
        return res.status(500).json({
            error: error.message
        })
    }
})

/* [PUT] - обновление текущего документа на новый в базе и локальном хранилище */
router.put('/update/:id', authenticate, async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const fileData = await getFile(id);
        if (!req.files) return res.status(200).json({
            result: 'FILE NOT ATTACHED'
        })
        const file = req.files.file;
        const splittedName = file.name.split('.');
        const fileExtension = splittedName.pop();
        const fileName = splittedName.join('.');

        await pool.query('UPDATE FILES SET file_name = ?, extension = ?, mime_type = ?, size = ?',
            [fileName, fileExtension, file.mimetype, file.size]);
        await fs.unlink(`${__dirname}/${fileData.file_name}-${id}.${fileData.extension}`).catch(error => console.error(error))
        await file.mv(`${__dirname}/${fileName}-${id}.${fileExtension}`)
        res.status(200).json({
            result: 'SUCCESS'
        })
    } catch (error) {
        return res.status(500).json({
            error: error.message
        })
    }
})

module.exports = router;