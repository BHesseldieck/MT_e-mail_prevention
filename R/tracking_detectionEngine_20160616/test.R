setwd("/Users/Ben/Desktop/Master Thesis/MT_e-mail_prevention/R/tracking_detectionEngine_20160616")
source("untrack.R")
#untrack()

library('jug')
jug() %>%
  post("/checkImages", function(req, res, err){
    write(req$body, 'input.json')
    untrack()
    res$json(jsonlite::read_json('output.json'))
  }) %>%
  simple_error_handler_json() %>%
  serve_it()
