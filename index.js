
// ---------Starts-------Here----------------
import express from "express"
// import fs from "fs"
import path from "path"

import mongoose from "mongoose"   // For Database
import { error } from "console"
import cookieParser from "cookie-parser"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

mongoose     //Connecting to dtabase
    .connect("mongodb://127.0.0.1:27017", {
        dbName: "backend",
    })
    .then(() => { console.log("Database connection established") })
    .catch(() => { console.log(error) })
// const server = express()
// we normally use app instead of server.
const app = express()
app.use(express.static(path.join(path.resolve(), "public")))  //app.use is used to acces any middleware// express.static is to set the static path
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.set("view engine", "ejs") // Auto set the engine...so we dont need to write the extension again and again
// const user = [] // temp datastoring
const userSchema = new mongoose.Schema({  //schema means the way we want to store data
    name: String,  //String -->type of data we want to store
    email: String,
    password: String,
})
const User = mongoose.model("User", userSchema)  //The .model() function makes a copy of schema

const isAuthenticated = async (req, res, next) => {
    const { token } = req.cookies;
    if (token) {
        const decoded = jwt.verify(token, "sdjasdbajsdbjasd");
        console.log(decoded)
        req.user = await User.findById(decoded._id);
        next();
    } else {
        res.redirect("/login");
    }
}
app.get("/", isAuthenticated, (req, res) => {
    res.render("logout", { name: req.user.name });
})

app.get("/login", (req, res) => {
    res.render("login")
})

app.post("/login", async (req, res) => {
    const { email, password } = req.body
    let user = await User.findOne({ email })
    if (!user) return res.redirect("/register")
    
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch){
         return res.render("login", {email, message: "Invalid password" })
    }else {
        const token = jwt.sign({ _id: user._id }, "sdjasdbajsdbjasd")
        res.cookie("token", token, {
            httpOnly: true,
            expires: new Date(Date.now() + 60 * 1000),
        })
    }
    res.redirect("/")
})

app.get("/register", (req, res) => {
    res.render("register");
})
app.get("/logout", (req, res) => {
    res.cookie("token", null, {
        httpOnly: true,
        expires: new Date(Date.now()),
    });
    res.redirect("/");
})
app.post("/register", async (req, res) => {
    const { name, email, password } = req.body
    let user = await User.findOne({ email })
    if (user) {
        return res.redirect("/login",{message: "User already registered"})
    }else {
        const hashedPassword = await bcrypt.hash(password,10)
        user = await User.create({
            name,
            email,
            password: hashedPassword,
        })
        const token = jwt.sign({ _id: user._id }, "sdjasdbajsdbjasd")
        res.cookie("token", token, {
            httpOnly: true,
            expires: new Date(Date.now() + 60 * 1000),
        })
        res.redirect("/login")
    }

    
})

app.listen(5000, () => {        //5000 -->port
    console.log("listening on port:5000")
})