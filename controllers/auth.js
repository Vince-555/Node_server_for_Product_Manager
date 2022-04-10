const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');

const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE
});

exports.login = async (req, res) => { 
  console.log("login hit")
  
  try {
    const { email, password } = req.body;

    if( !email || !password ) {
      return res.status(400).render('login', {
        message: 'Please provide an email and password'
      })
    }

    db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
      console.log(results);
      if( !results || !(await bcrypt.compare(password, results[0].password)) ) {
        message = 'Something wrong';
        return res.status(401).json(
          message
        );
      } else {
        const id = results[0].id;

        const token = jwt.sign({ id }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN
        });
        console.log("The token is: " + token);
        data = {
          result: results,
          message: "login success",
          token: token
        }
        return res.status(200).json(
          data
        );
      }

    })

  } catch (error) {
    console.log(error);
  }
}


exports.product = async (req, res) => {
  
  try {
    const data = req.body;

    db.query('SELECT * FROM product',  async (error, results) => {
      console.log(results);
      if( !results ) {
        message = 'Something wrong';
        return res.status(401).json(
          message
        );
      } else {
        
        return res.status(200).json(
          results
        );
      }

    })

  } catch (error) {
    console.log(error);
  }
}


exports.productById = async (req, res) => {
  
  try {
    const data = req.params;
    console.log("add product dataId",data);

    db.query('SELECT * FROM product WHERE id = ?', [data.id],  async (error, results) => {
      console.log("this byid data",results);
      if( !results ) {
        message = 'Something wrong';
        return res.status(401).json(
          message
        );
      } else {
        
        return res.status(200).json(
          results
        );
      }

    })

  } catch (error) {
    console.log(error);
  }
}
exports.tagById = async (req, res) => {
  
  try {
    const data = req.params;
    console.log("tag===> dataId",data);
    db.query('SELECT * FROM tag WHERE productId = ?', [data.id],  async (error, results) => {
      console.log("this tag data",results);
      if( !results ) {
        message = 'Something wrong';
        return res.status(401).json(
          message
        );
      } else {
        
        return res.status(200).json(
          results
        );
      }

    })

  } catch (error) {
    console.log(error);
  }
}


exports.addProduct = (req, res) => {
  console.log("add product data",req.body);
  let data = req.body;

    db.query('INSERT INTO product SET ?', {productName: data.productName, productCode: data.productCode, releaseDate: data.releaseDate, price: data.price, description: data.description, starRating: data.starRating,imageUrl: data.image,   }, (error, results) => {
      if(error) {
        console.log(error);
      } else {
        // console.log("tags lag data",data.tags[0], results.insertId);
        req.body.tags.forEach((number) => {
        
          db.query('INSERT INTO tag SET ?', {productId: results.insertId, tag: number  }, (error, resultTag) => {
            if(error) {
              console.log(error);
            } else {
              console.log("tis is add P resultTag",resultTag);
            
            }
          })

        });


        
        
        console.log("tis is add insertId: results",req.body.tags[0]);
        let data = {
          product: results,
          // tag: resultTag
        }
        
        

        console.log("tis is add P results",data);
        return res.status(200).json(
          data
        );
      }
    })
}

exports.updateProduct = (req, res) => {
  console.log("add product data", req.params, req.body);
  data = req.body;
    db.query(`Update product SET ? where ?`, [{productName: data.productName, productCode: data.productCode,price: data.price, description: data?.description, starRating: data?.starRating   }, req.params], function (error, results) {
      if(error) {
        console.log(error);
      } else {

        db.query('DELETE from tag where productId = ? ',req.params.id,function (error, results2) {

        })
        req.body.tags.forEach((number) => {
        
          db.query('INSERT INTO tag SET ?', {productId: req.params.id, tag: number  }, (error, resultTag) => {
            if(error) {
              console.log(error);
            } else {
              console.log("tis is add P resultTag",resultTag);
            
            }
          })

        });
        console.log("tis is add P res",results);
        return res.status(200).json(
          results
        );
      }
    })
}

exports.register = (req, res) => {
  console.log(req.body);

  const { name, email, password, confirmPass } = req.body;

  db.query('SELECT email FROM users WHERE email = ?', [email], async (error, results) => {
    if(error) {
      console.log(error);
    }

    if( results.length > 0 ) {
      return res.render('register', {
        message: 'That email is already in use'
      })
    } else if( password !== confirmPass ) {
      return res.render('register', {
        message: 'Passwords do not match'
      });
    }

    let hashedPassword = await bcrypt.hash(password, 8);
    console.log(hashedPassword);

    db.query('INSERT INTO users SET ?', {name: name, email: email, password: hashedPassword }, (error, results) => {
      if(error) {
        return res.status(401).json(
          error
        );
      } else {
        data = {
          result: results,
          message: "Register success",
          
        }
        console.log("this is reg res",results);
        return res.status(200).json(
          data
        );
      }
    })


  });

}

exports.isLoggedIn = async (req, res, next) => {
  // console.log(req.cookies);
  if( req.cookies.jwt) {
    try {
      //1) verify the token
      const decoded = await promisify(jwt.verify)(req.cookies.jwt,
      process.env.JWT_SECRET
      );

      console.log(decoded);

      //2) Check if the user still exists
      db.query('SELECT * FROM users WHERE id = ?', [decoded.id], (error, result) => {
        console.log(result);

        if(!result) {
          return next();
        }

        req.user = result[0];
        console.log("user is")
        console.log(req.user);
        return next();

      });
    } catch (error) {
      console.log(error);
      return next();
    }
  } else {
    next();
  }
}

exports.logout = async (req, res) => {
  res.cookie('jwt', 'logout', {
    expires: new Date(Date.now() + 2*1000),
    httpOnly: true
  });

  res.status(200).redirect('/');
}