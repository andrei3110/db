const express = require('express')
const mysql = require('mysql');
const path = require('path');
const session = require('express-session');
const { count } = require('console');
const app = express();

require('dotenv').config();

// Соединение с базой данных
const connection = mysql.createConnection({
    host: process.env.HOST,
    database: process.env.DATABASE,
    user: process.env.DB_USER,
    password: process.env.PASSWORD
});

connection.connect((err) => {
    if (err) {
        console.log(err);
    }
});

// Путь к директории файлов ресурсов (css, js, images)
app.use(express.static('public'));

// Настройка шаблонизатора
app.set('view engine', 'ejs');

// Путь к директории файлов отображения контента
app.set('views', path.join(__dirname, 'views'));

// Обработка POST-запросов из форм
app.use(express.urlencoded({ extended: true }));

// Инитиализацияя сессии
app.use(session({ secret:"Secret", resave: false, saveUninitialized:true }));

// Запуск веб-сервера по адресу http://localhost:3000
app.listen(3000);

function isAuth(req, res, next) {
    if (req.session.auth) {
        next();
    } else {
        res.redirect('/');
    }
};
/**
 * Маршруты
 */
app.get('/', (req, res) => {

    const itemsPerPage = 4;
    let page = parseInt(req.query.page); // localhost?page=4
  
  
    connection.query("SELECT COUNT(*) as size FROM items", (rowsErr, rows, fields) => {
      if (rowsErr) throw err;

      let m = Math.ceil(rows[0].size / 4)
      if (!page) page = 1;

      if (page > m) page = m;
      connection.query("SELECT * FROM items LIMIT ? OFFSET ?", [itemsPerPage, itemsPerPage * (page - 1)], (err, data, fields) => {
        if (err) throw err;

        res.render('home', {
          'items': data,
          number: Number(m),

        });
      });
    });
  })
app.get('/items/:id', (req, res) => {
    connection.query("SELECT * FROM items WHERE id=?", [req.params.id],
        (err, data, fields) => {
            if (err) {
                console.log(err);
            }

            res.render('item', {
                'item': data[0],
            })
        });
})

app.get('/add', isAuth, (req, res) => {
    res.render('add')
})

app.post('/store', (req, res) => {
    connection.query(
        "INSERT INTO items (title, image) VALUES (?, ?)",
        [[req.body.title], [req.body.image]],
        (err, data, fields) => {
            if (err) {
                console.log(err);
            }

            res.redirect('/');
        }
    );
})

app.post('/delete', (req, res) => {
    connection.query(
        "DELETE FROM items WHERE id=?", [[req.body.id]], (err, data, fields) => {
            if (err) {
                console.log(err);
            }
            res.redirect('/');
        }
    );
})

app.post('/update', (req, res) => {
    connection.query(
        "UPDATE items SET title=?, image=? WHERE id=?", [[req.body.title],[req.body.image],[req.body.id]], (err, data, fields) => {
            if (err) {
                console.log(err);
            }
            res.redirect('/');
        }
    );
})

app.get('/auth', (req,res) => {
    res.render('auth');

});

app.post('/authh', (req, res) => {
    connection.query(
        "SELECT * FROM users WHERE name=? and password=?",
        [[req.body.name], [req.body.password]],
        (err, data, fields) => {
            if (err) {
                console.log(err);
            }
            if (data.length > 0) {
                console.log('auth'); 
                req.session.auth = true;      
            } else {
                console.log('no auth');
                req.session.auth = false;
            }
            res.redirect('/');
        }
    );
})