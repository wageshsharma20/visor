import { clearDetections, listDetections } from '../server/routes.js';

export const GET = listDetections;
export const DELETE = clearDetections;
