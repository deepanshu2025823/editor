const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const nodemailer = require("nodemailer");
const mysql = require("mysql2/promise"); 

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const dbConfig = {
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  user: '2WB2poogPx77GW2.root',
  password: 'X7VFNy0V42V6tNZC',
  port: 4000,
  database: 'test',
  ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
  }
};

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "india.careerlabconsulting@gmail.com",
    pass: "wvph klwz iwfc vtcx", 
  },
});

app.prepare().then(async () => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    if (parsedUrl.pathname.startsWith("/api/socket")) {
    } else {
       handle(req, res, parsedUrl);
    }
  });

  const io = new Server(httpServer, {
    path: "/api/socket",
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ['polling', 'websocket'] 
  });

  const pool = mysql.createPool(dbConfig);
  const employees = new Map();
  const admins = new Set();

  io.on("connection", (socket) => {

    if(socket.handshake.query.role === 'admin') {
        admins.add(socket.id);
    }

    socket.on("admin-join", ({ targetId }) => {
        const targetSocket = employees.get(targetId);
        if (targetSocket) {
            io.to(targetSocket).emit("request-offer", { adminId: socket.id });
        }
    });

    socket.on("offer", ({ targetId, offer }) => {
        socket.broadcast.emit(`offer-${targetId}`, offer);
    });

    socket.on("answer", ({ targetId, answer }) => {
        const empSocket = employees.get(targetId);
        if(empSocket) io.to(empSocket).emit("answer", answer);
    });

    socket.on("candidate", ({ targetId, candidate }) => {
        socket.broadcast.emit(`candidate-${targetId}`, candidate);
    });

    socket.on("register-employee", async (employeeId) => {
      employees.set(employeeId, socket.id);
      socket.join(employeeId);
      socket.broadcast.emit(`status-${employeeId}`, true);
      
      console.log(`✅ Check-In: ${employeeId}`);

      try {
        const [rows] = await pool.query("SELECT * FROM attendance_logs WHERE employee_id = ? AND date = CURRENT_DATE", [employeeId]);
        if (rows.length === 0) {
           await pool.query("INSERT INTO attendance_logs (employee_id, status) VALUES (?, 'Working')", [employeeId]);
        } else {
           await pool.query("UPDATE attendance_logs SET status = 'Working', check_out = NULL WHERE employee_id = ? AND date = CURRENT_DATE", [employeeId]);
        }
      } catch (err) { console.error("DB Check-In Error:", err.message); }
    });

    socket.on("check-status", (employeeId) => {
      const isOnline = employees.has(employeeId);
      socket.emit(`status-${employeeId}`, isOnline);
    });

    socket.on("disconnect", async () => {
      admins.delete(socket.id);
      for (const [empId, sockId] of employees.entries()) {
        if (sockId === socket.id) {
          employees.delete(empId);
          io.emit(`status-${empId}`, false);
          console.log(`❌ Check-Out: ${empId}`);
          try {
             await pool.query("UPDATE attendance_logs SET check_out = CURRENT_TIMESTAMP, status = 'Offline' WHERE employee_id = ? AND date = CURRENT_DATE", [empId]);
          } catch (err) { console.error("DB Error:", err.message); }
          break;
        }
      }
    });
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});