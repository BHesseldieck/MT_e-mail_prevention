setwd("/tracking_detectionEngine_20160616")

source("detectTrackingImages.R")

library("stringr")
library("stringi")
library("parallel")
library("data.table")
library("caret")
library("C50")
library('jug')

jug() %>%
  get("/", function(req, res, err){
    "Detection engine running"
  }) %>%
  post("/checkImages", function(req, res, err){
    write(req$body, 'input.json')
    detectTrackingImages()
    res$json(jsonlite::read_json('output.json'))
  }) %>%
  simple_error_handler_json() %>%
  serve_it(host = Sys.getenv("JUG_HOST"), port = as.integer(Sys.getenv("JUG_PORT")))
