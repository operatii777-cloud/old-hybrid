/**
 * Real-time KDS (Kitchen Display System) updates via Socket.IO.
 * Call setupKdsSocket(io) after creating the Socket.IO server instance.
 */

import { logger } from '../utils/logger.js';

/**
 * Attach KDS-specific Socket.IO event handlers to the given server instance.
 * @param {import('socket.io').Server} io
 */
export function setupKdsSocket(io) {
  const kdsNamespace = io.of('/kds');

  kdsNamespace.on('connection', (socket) => {
    logger.info(`KDS client connected: ${socket.id}`);

    // Client joins a specific station room (e.g. 'kitchen', 'bar', 'grill')
    socket.on('join-station', (station) => {
      if (typeof station !== 'string' || !station.trim()) {
        socket.emit('error', { message: 'Invalid station name' });
        return;
      }
      socket.join(station);
      logger.info(`KDS socket ${socket.id} joined station: ${station}`);
    });

    socket.on('disconnect', () => {
      logger.info(`KDS client disconnected: ${socket.id}`);
    });
  });

  return kdsNamespace;
}

/**
 * Broadcast a new order item to the relevant KDS station.
 * @param {import('socket.io').Server} io
 * @param {string} station - e.g. 'kitchen', 'bar'
 * @param {object} item
 */
export function broadcastKdsItem(io, station, item) {
  io.of('/kds').to(station).emit('new-item', item);
}

/**
 * Broadcast an order-status update (e.g. item marked as ready) to a station.
 * @param {import('socket.io').Server} io
 * @param {string} station
 * @param {object} update - { orderId, itemId, status }
 */
export function broadcastKdsUpdate(io, station, update) {
  io.of('/kds').to(station).emit('item-update', update);
}
