/* eslint-disable no-plusplus, fp/no-mutation, fp/no-mutating-methods, no-bitwise, react/destructuring-assignment */
import fs from 'fs';
import ndarray from 'ndarray';
import { fromArrayBuffer } from 'numpy-parser';
import path from 'path';

const worldMap: boolean[][] = [];

async function init() {
  // when the project builds data.npy file moves to different location
  let buff: Buffer;
  try {
    buff = fs.readFileSync(path.resolve(__dirname, '../../assets/data.npy'));
  } catch (_error) {
    buff = fs.readFileSync(path.resolve(__dirname, '../assets/data.npy'));
  }

  const object = fromArrayBuffer(buff.buffer.slice(0, buff.length));

  const npyArray = ndarray(object.data, object.shape);

  // worldMap[lon][lat], max lon: 7200, max lat: 3600 (1 / 0.05 = 20 points per degree)

  for (let lon = 0; lon < 7200; lon++) {
    const row: boolean[] = [];
    for (let lat = 0; lat < 450; lat++) {
      const elem = npyArray.get(lon, lat);
      const result = Array.from(Array(8).keys()).map((i) => {
        const mask = 128 >> i;
        return Boolean(elem & mask);
      });
      row.push(...result);
    }
    worldMap.push(row);
  }
}

init();

let visited: Map<string, boolean>;
let stack: { lon: number; lat: number }[];

function BFS(): [number, number] | null {
  const head = stack.shift();

  if (!head) return null;
  if (visited.has(`${head.lon},${head.lat}`)) return BFS();
  if (worldMap[head.lon][head.lat] === false) return [head.lon, head.lat];

  visited.set(`${head.lon},${head.lat}`, true);

  const up = { lon: (head.lon + 1) % 7200, lat: head.lat };
  const down = { lon: (head.lon + 1) % 7200, lat: head.lat };
  const right = { lon: head.lon, lat: (head.lat + 1) % 3200 };
  const left = { lon: head.lon, lat: (head.lat - 1) % 3200 };

  if (!visited.has(`${up.lon},${up.lat}`)) stack.push(up);
  if (!visited.has(`${down.lon},${down.lat}`)) stack.push(down);
  if (!visited.has(`${right.lon},${right.lat}`)) stack.push(right);
  if (!visited.has(`${left.lon},${left.lat}`)) stack.push(left);

  return BFS();
}

export function getNOAANearestAvailablePoint(
  longitude: number,
  latitude: number,
): [number, number] {
  const lonIndex = Math.round((180 + longitude) / 0.05);
  const latIndex = Math.round((90 + latitude) / 0.05);

  visited = new Map<string, boolean>();
  stack = [{ lon: lonIndex, lat: latIndex }];
  const result = BFS();
  if (result === null) throw new Error('Did not find nearest point!');

  return [result[0] * 0.05 - 180, result[1] * 0.05 - 90];
}
