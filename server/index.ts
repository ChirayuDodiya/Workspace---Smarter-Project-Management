import { createServer } from 'http';
import { Server } from 'socket.io';
import { app } from './src/app.js';
import './src/services/cron.service.js';
import prisma from './src/prisma/client.js';

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

app.set('io', io);

// Map of projectSlug -> Map of userId -> { user, socketIds: Set }
const projectPresence = new Map();

// Helper to handle leaving a project presence
const handleLeaveProject = (socket, io) => {
  const { projectSlug, userId } = socket;
  if (projectSlug && userId) {
    socket.leave(`project:${projectSlug}`);
    const usersInProject = projectPresence.get(projectSlug);
    if (usersInProject) {
      const userData = usersInProject.get(userId);
      if (userData) {
        userData.socketIds.delete(socket.id);
        if (userData.socketIds.size === 0) {
          usersInProject.delete(userId);
        }
      }
      if (usersInProject.size === 0) {
        projectPresence.delete(projectSlug);
      } else {
        // Broadcast updated presence list
        const members = Array.from(usersInProject.values()).map((u) => u.user);
        io.to(`project:${projectSlug}`).emit('project:presence', members);
      }
    }
    socket.projectSlug = null;
    socket.userId = null;
  }
};

io.on('connection', (socket) => {
  // console.log('A user connected:', socket.id);

  // Join user-specific notification room
  socket.on('join:user', (userId) => {
    socket.join(`user:${userId}`);
    // console.log(`Socket ${socket.id} joined user room: user:${userId}`);
  });

  // Join project room with presence tracking
  socket.on('join:project', (payload) => {
    // Gracefully support old client code if payload is just projectSlug string
    let projectSlug;
    let user;

    if (typeof payload === 'string') {
      projectSlug = payload;
    } else if (payload && typeof payload === 'object') {
      projectSlug = payload.projectSlug;
      user = payload.user;
    }

    if (!projectSlug) return;

    // Leave previous project room if any
    if (socket.projectSlug && socket.projectSlug !== projectSlug) {
      handleLeaveProject(socket, io);
    }

    socket.join(`project:${projectSlug}`);

    if (user) {
      socket.projectSlug = projectSlug;
      socket.userId = user.id;

      if (!projectPresence.has(projectSlug)) {
        projectPresence.set(projectSlug, new Map());
      }
      const usersInProject = projectPresence.get(projectSlug);
      if (!usersInProject.has(user.id)) {
        usersInProject.set(user.id, {
          user,
          socketIds: new Set(),
        });
      }
      usersInProject.get(user.id).socketIds.add(socket.id);

      // console.log(`Socket ${socket.id} joined project room: project:${projectSlug} (User ID: ${user.id})`);

      // Broadcast updated presence list
      const members = Array.from(usersInProject.values()).map((u) => u.user);
      io.to(`project:${projectSlug}`).emit('project:presence', members);
    } else {
      // console.log(`Socket ${socket.id} joined project room: project:${projectSlug} (No presence profile)`);
    }
  });

  // Explicitly leave project room
  socket.on('leave:project', () => {
    handleLeaveProject(socket, io);
  });

  socket.on('disconnect', () => {
    handleLeaveProject(socket, io);
    // console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
});
