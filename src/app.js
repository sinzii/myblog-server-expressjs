require('./bootstrap/logger');
const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const ResourceNotFoundError = require('./exceptions/404Error');
const config = require('./config');
const logger = require('log4js').getLogger('app');

async function bootstrapping() {
    logger.debug('Bootstrapping the app');
    const app = express();

    /*------------------------------------
        Customize express application
    ------------------------------------*/
    app.disable('etag');
    app.disable('x-powered-by');

    /*------------------------------------
        Setup logger
    ------------------------------------*/
    app.use(morgan('dev')); // Http request logger

    /*------------------------------------
        Setup tools
    ------------------------------------*/
    app.use(express.json()); // Allow parsing json object in request body
    app.use(express.urlencoded({ extended: false })); // Allow parsing urlencoded in submitted body (FORM DATA)
    app.use(cookieParser()); // Parse cookies from request and save them to req.cookies

    // Load customizations
    require('./customization');
    /*------------------------------------
        Setup MongoDB
    ------------------------------------*/
    const mongooseConfig = {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
    };

    // logger.debug(mongooseConfig);
    await mongoose.connect(config.mongooseUrl, mongooseConfig);
    if (config.dev_mode) {
        mongoose.set('debug', true);
    }

    // Loads mongoose models
    require('./models');

    /*------------------------------------
        Init Default Data
    ------------------------------------*/
    const UserService = require('./services/UserService');

    async function hasAnyUsers() {
        const first10Users = await UserService.findAll({});
        return first10Users.length;
    }

    async function createDefaultUsers() {
        if (await hasAnyUsers()) {
            return;
        }

        const adminUser = config.adminUser;
        if (!adminUser.name) {
            adminUser.name = 'Boss';
        }

        await UserService.create(adminUser);
        logger.info('Default admin user has been created');
    }

    await createDefaultUsers();

    /*------------------------------------
        Setup endpoints
    ------------------------------------*/
    const apiV1 = require('./api/v1');
    app.use('/api/v1', apiV1);

    app.get('/', (req, res) => {
        res.json({ message: 'Welcome to Project Alpha API' });
    });

    /*------------------------------------
        Handle errors
    ------------------------------------*/
    app.use((req, res, next) => {
        next(new ResourceNotFoundError());
    });

    app.use((err, req, res, next) => {
        if (typeof err.handleError === 'function') {
            return err.handleError(req, res);
        }

        const { status } = err;

        if (status) {
            res.status(status);

            const { message } = err;
            if (message) {
                return res.json({ message });
            } else {
                return res.send();
            }
        } else {
            const message = 'Oops! We\'re running into a problem.';

            return res.status(500).json({ message });
        }
    });

    // TODO disconnect mongodb connection on terminating Node process + shutdown logger

    /*------------------------------------
        Start server
    ------------------------------------*/
    const port = config.httpPort || 3000;
    app.listen(port, function() {
        logger.info(`
    --------------------------------------------------------
    Server is started on port ${port} at ${new Date()} 
    --------------------------------------------------------
    `);
    });
}

(async () => {
    await bootstrapping();
})();
