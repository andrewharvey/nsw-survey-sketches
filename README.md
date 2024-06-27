# nsw-survey-sketches

Scripts to download all NSW Survey Sketches and convert them to geotagged JPEG files.

## Dependencies

    apt install -y nodejs wget gdal-bin make parallel pipx gzip pdfimages perl
    pipx install esri2geojson

## Usage

1. Fetch source data as GeoJSON

    make data/SurveyMarkGDA2020.geojson

2. Convert to CSV with a BBOX

  env BBOX="xmin ymin xmax ymax" make data/SurveyMark.csv

...or without a BBOX

  make data/SurveyMark.csv

3. Fetch sketch plans

  make data/plans
  make renamePlans

4. Extract images from the PDFs

    make data/images

5. Geotag JPGs

    make geotag
