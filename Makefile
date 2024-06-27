data/SurveyMarkGDA2020.geojson:
	mkdir -p data
	esri2geojson --verbose --paginate-oid --timeout 240 --max-page-size 2000 'https://portal.spatial.nsw.gov.au/server/rest/services/SurveyMarkGDA2020/FeatureServer/0' $@

data/SurveyMarkGDA2020.fgb: data/SurveyMarkGDA2020.geojson
	ogr2ogr -f FlatGeobuf $@ $<

data/SurveyMarkGDA2020.geojson.gz: data/SurveyMarkGDA2020.geojson
	gzip --keep $<

data/SurveyMark.csv: data/SurveyMarkGDA2020.geojson
	@if [ -n "${BBOX}" ] ; then \
		ogr2ogr -select 'marktype,marknumber' -f CSV  -spat ${BBOX} $@ $<; \
	else \
		ogr2ogr -select 'marktype,marknumber' -f CSV $@ $<;\
	fi

data/SketchPlansURLs.txt: data/SurveyMark.csv
	sed -E 's/^(.*),(.*)$/https:\/\/maps.six.nsw.gov.au\/SketchPlansWS\/rest\/getSketchPlans?surveyMark=\1\2\&outputType=current\&markType=\1\&markNumber=\2/g' < $< | tail -n+1 > $@

data/plans: data/SketchPlansURLs.txt
	mkdir -p $@
	wget --directory-prefix=$@ --input-file=$<

# rename as PMXXX.pdf
renamePlans:
	./src/renamePlans.sh

data/images:
	mkdir -p $@
	parallel pdfimages -j {} $@/{/.} ::: data/plans/*.pdf

data/geotagged:
	mkdir -p $@
	./src/geotag.js
