import { control, icon, map, tileLayer } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerImage from 'leaflet/dist/images/marker-icon.png';
import retinaMarkerImage from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

export const destinationIcon = icon({
  iconUrl: markerImage,
  iconRetinaUrl: retinaMarkerImage,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
  popupAnchor: [0, -36],
});

export function createPlanMap(container) {
  const instance = map(container, { scrollWheelZoom: false, zoomControl: false });
  control.zoom({ zoomInTitle: 'Acercar', zoomOutTitle: 'Alejar' }).addTo(instance);
  tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(instance);
  return instance;
}
