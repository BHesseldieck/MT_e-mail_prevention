source("detectionEngine.R")
source("feature_extraction.R")
source("helperfunctions.R")

detectTrackingImages <- function(){

  detectionModel <- readRDS("model_c50_201705.rds")
  #connection <- file("example_data/imageData.json")
  connection <- file("input.json")
  outConnection <- stdout()

  detectTracking(connection, detectionModel, outConnection)
}
