# Wrapper function to detect tracking images among a set of images
# from raw image and header data
# Input: raw image and header data JSON input
#        read in via stream_in() {jsonlite} from connection
# Output: Array of image index | tracking (1/0)
detectTracking <- function(connection, detectionModel, outConnection){
  library("data.table")
  library("caret")
  library("C50")

  imageData <- data.table(jsonlite::fromJSON(connection))

  # Set the keys for the data tables
  setkey(imageData, mailID)
  # include the number of image links per mail ID as a column
  imageData[,imgPos := 1:.N, by = mailID]
  imageData[,imgCount := .N, by = mailID]

  # Feature extraction with pre-loaded function
  imageData <- featureExtraction(imageData)

  # Check if all model (dummy) variables are present in data
  # If not, naively replace by 0 column
  detectionModel.x <- detectionModel$finalModel$xNames
  data.x <- colnames(imageData)
  for(dummy in detectionModel.x[!detectionModel.x %in% data.x]) imageData[dummy] <- 0

  # Make predictions (uses model package)
  imageData$predProb <- predict(detectionModel, newdata = imageData, type = "prob")[,2]
  # Just in case an empty e-mail gets passed
  # These are marked with src = 'NoImages' in Python code
  imageData[src == "NoImages", predProb := 0]

  # The optimal threshold was determined empirically
  imageData[, tracking := ifelse(predProb > 0.6, 1, 0)]

  # Write JSON to output file
  jsonlite::write_json(imageData[imageData$tracking == 1, .(imgPos, tracking, src)], 'output.json')
  print("images checked")

  # Stream out as ndjson
  #jsonlite::stream_out(imageData[, .(imgPos, tracking)], con = outConnection)
  #return(NULL)
}
