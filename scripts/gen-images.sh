#!/bin/bash
# Generate all City Line Property images in background
cd /home/z/my-project
mkdir -p public/images/properties

gen() {
  local prompt="$1"; local out="$2"; local size="${3:-1344x768}"
  if [ -s "$out" ]; then echo "SKIP $out"; return 0; fi
  for i in 1 2 3; do
    z-ai image -p "$prompt" -o "$out" -s "$size" && echo "OK $out" && return 0
    echo "RETRY $i $out"; sleep 2
  done
  echo "FAIL $out"
}

gen "Ultra modern white minimalist luxury house exterior with clean geometric lines, large glass windows, manicured lawn, bright daylight, professional architectural photography, white and warm neutral tones, high quality, detailed" "public/images/hero.jpg" "1440x768" &
gen "Luxury contemporary white villa exterior with swimming pool, palm trees, evening golden light, professional real estate photography, clean modern architecture, high quality" "public/images/properties/villa-1.jpg" &
wait
gen "Bright airy luxury villa living room interior, white sofas, wooden floor, floor to ceiling windows, garden view, professional interior photography, minimalist modern style" "public/images/properties/villa-2.jpg" &
gen "Modern apartment building exterior, white facade with balconies, blue sky, palm trees, professional architectural photography, clean lines" "public/images/properties/apartment-1.jpg" &
wait
gen "Bright modern apartment living room interior, light oak flooring, white walls, cozy beige sofa, large window with city view, professional interior photography, minimal scandinavian style" "public/images/properties/apartment-2.jpg" &
gen "Luxury penthouse terrace with infinity view over modern city skyline at sunset, elegant outdoor furniture, glass railing, professional real estate photography" "public/images/properties/penthouse-1.jpg" &
wait
gen "Luxurious penthouse interior with double height ceiling, marble floor, designer furniture, panoramic city view windows, warm lighting, professional interior photography" "public/images/properties/penthouse-2.jpg" &
gen "Row of elegant modern townhouses, white and brick facades, clean sidewalk, trees, bright daylight, professional architectural photography" "public/images/properties/townhouse-1.jpg" &
wait
gen "Beautiful modern family house exterior with front garden, warm lighting, driveway, clear sky, professional real estate photography, white and gray palette" "public/images/properties/house-1.jpg" &
gen "Modern corporate office interior, open plan workspace, glass partitions, white desks, indoor plants, bright natural light, professional photography" "public/images/properties/office-1.jpg" &
wait
gen "Stylish industrial loft interior, exposed brick wall, high ceiling, large factory windows, wooden floor, designer furniture, warm daylight, professional interior photography" "public/images/properties/loft-1.jpg" &
gen "Elegant modern kitchen interior with marble island, white cabinets, brass fixtures, pendant lights, bright airy, professional interior photography" "public/images/properties/kitchen-1.jpg" &
wait
gen "Luxury master bedroom interior, white and warm beige tones, large bed, soft lighting, panoramic window, professional interior photography, hotel style" "public/images/properties/bedroom-1.jpg" &
gen "Modern real estate team of professional consultants in bright white office, diverse business team, natural light, professional corporate photography" "public/images/about-team.jpg" &
wait
gen "Modern city skyline at dusk with warm golden lights, wide panoramic view, professional photography, soft gradient sky" "public/images/cta-bg.jpg" "1440x768"

echo "ALL DONE"
