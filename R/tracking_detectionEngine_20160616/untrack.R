untrack <- function(){
  #setwd("/Users/Ben/Desktop/Master Thesis/JohannesHaupt_code/tracking_detectionEngine_20160616")
  source("detectionEngine.R")
  source("feature_extraction.R")
  source("helperfunctions.R")
  
  detectionModel <- readRDS("model_c50_201705.rds")
  #connection <- file("example_data/imageData.json")
  connection <- file("input.json")
  outConnection <- stdout()
  
  detectTracking(connection, detectionModel, outConnection)
}
