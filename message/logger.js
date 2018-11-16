const winston = require('winston')

const levels = { 
    levels: {
        error: 0, 
        warn: 1, 
        info: 2, 
        verbose: 3, 
        debug: 4,
        silly: 5
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        verbose: 'blue',
        debug: 'orange'
    }
} 

const logger = winston.createLogger({
    level: levels.silly,
    format: winston.format.combine( 
        winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'}),
        winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        level: 'debug',
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(
            info => `${info.timestamp} ${info.label} - ${info.level}: ${info.message}`
          )
        )
      }),
      new winston.transports.File({ filename: 'combined.log' })
    ]
});

module.exports = logger 

