const { exceptionHandler, checkValidId } = require('../../../utils/request');
const PostService = require('../../../services/PostService');

const express = require('express');
const router = express.Router();

module.exports = router;

router.param('id', checkValidId);

/**
 * Get all active posts by defaults
 */
router.get('/', exceptionHandler(async (req, res) => {
    const posts = await PostService.findAll(req.query);
    return res.json(posts);
}));

/**
 * Get a post
 */
router.get('/:id', exceptionHandler(async (req, res, next) => {
    const { id } = req.params;
    const post = await PostService.findOne(id);
    return res.json(post);
}));

/**
 * Create a new post
 */
router.post('/', exceptionHandler(async (req, res, next) => {
    const post = await PostService.create(req.body);
    return res.json(post);
}));

/**
 * Update a post
 */
router.put('/:id', exceptionHandler(async (req, res, next) => {
    const { id } = req.params;
    const targetPost = await PostService.update(id, req.body);
    return res.json(targetPost);
}));

/**
 * Delete a post
 */
router.delete('/:id', exceptionHandler(async (req, res, next) => {
    const { id } = req.params;
    await PostService.delete(id);
    return res.status(204).send();
}));

/**
 * Publish a post
 */
router.put('/:id/publish', exceptionHandler(async (req, res, next) => {
    const { id } = req.params;
    await PostService.publish(id);
    return res.status(204).send();
}));

/**
 * Officialize a post
 */
router.put('/:id/officialize', exceptionHandler(async (req, res, next) => {
    let { id } = req.params;
    await PostService.officialize(id, true);
    return res.status(204).send();
}));

/**
 * Un-officialize a post
 */
router.put('/:id/unofficialize', exceptionHandler(async (req, res, next) => {
    let { id } = req.params;
    await PostService.officialize(id, false);
    return res.status(204).send();
}));
