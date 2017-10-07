

featureExtraction <- function(imageData){
  
library("stringr")
library("stringi")
  library("parallel")

  #### Helper Function definition ####
  # Function to count occurances of 'pattern' in 'string'
  countOccurances <- function(string,pattern){
    sapply(
      str_extract_all(string,pattern)
      ,length)
  }
  
  # 1 if the value is not the most common value
  outsider <- function(column){            
    as.integer(column != 
                 names(sort(table(column),decreasing=TRUE)[1])
    )
  }
  
  #### END FUNCTION DEFINITION ###
  
  #### Image position ####
  # Relative position of image in mail
  imageData[, relImagePosition := imgPos/imgCount, by = mailID]
  imageData[, imagesToBorder := pmin(imgCount - imgPos, imgPos - 1)]
  
  #### Image src related features ####
  # counts regarding the src length, number count, uppercase count, lowercase count (redundant), case change and number letter changes
  imageData[,linkLength :=   str_length(src)]
  imageData[,numbers := (str_count(src,"[:digit:]") / linkLength)]
  imageData[,upperLetters :=  (str_count(src,paste(LETTERS,collapse="|"))/ linkLength)]
  imageData[,caseChanges :=     (str_count(src,"[[:lower:]]{1}[[:upper:]]{1}|[[:upper:]]{1}[[:lower:]]{1}")/ linkLength)]
  imageData[,numalphaChange := (str_count(src,"[[:alpha:]]{1}[[:digit:]]{1}|[[:digit:]]{1}[[:alpha:]]{1}")/ linkLength)]
  
  # Counts occurrence of each letter and the deviation from the in-mail letter distribution
  letterlist <- c("b","f","i","m","w")
  imageData[, (paste0("count_",letterlist)) := lapply(letterlist, function(x) (stri_count_regex(pattern = x, str = as.character(tolower(src))) * 100 / linkLength))]
  for(column in paste0("count_",letterlist)){
    imageData[, (paste0(column,"_meandev")) := base::get(column) - mean(base::get(column)), by = mailCounter]
  }
  
  # Standardized divergence of src length to mean src length in mail
  imageData[, relSrcLength:= (linkLength - median(linkLength)) /
              max(0.05, sd(linkLength), na.rm=TRUE)
            , by = mailID]
  
  # length of folder structure
  imageData[,folderDepth :=  str_count(src, pattern = "/+")]
  
  
  # Standardized divergence of src folder number to mean folders in mail
  imageData[, relFolderDepth := (folderDepth - median(folderDepth)) /
              max(0.05, sd(folderDepth), na.rm=TRUE)
            , by = mailID]
  
  # spot keywords
  imageData[,spotTrackSrc :=as.numeric(grepl("track",src,ignore.case = TRUE))]
  imageData[,spotIDSrc    :=as.numeric(grepl("id[^[:alpha:]]",src,ignore.case = TRUE))]
  imageData[,spotListSrc  :=as.numeric(grepl("list",src,ignore.case = TRUE))]
  imageData[,spotUserSrc  :=as.numeric(grepl("user",src,ignore.case = TRUE))]
  imageData[,spotClickSrc :=as.numeric(grepl("click",src,ignore.case = TRUE))]
  imageData[,spotTagSrc   :=as.numeric(grepl("tag",src,ignore.case = TRUE))]
  imageData[,spotViewSrc  :=as.numeric(grepl("view",src,ignore.case = TRUE))]
  imageData[,spotOpenSrc  :=as.numeric(grepl("open",src,ignore.case = TRUE))]
  imageData[,spotAt := as.numeric(grepl("@",src,ignore.case = TRUE)) ]
  imageData[,spotQuestionmark := as.numeric(grepl("\\?",src,ignore.case = TRUE)) ]
  
  ### File structure
  # Function to count how often ID like structure occur in vector of strings
  findID <- function(stringVector, lengthCutoff) sum((grepl(x = stringVector, pattern = "[[:lower:]]{1}[[:upper:]]{1}.*[[:lower:]]{1}[[:upper:]]{1}|[[:upper:]]{1}[[:lower:]]{1}.*[[:upper:]]{1}[[:lower:]]{1}") |
                                                        grepl(x = stringVector, pattern = "[[:alpha:]]{1}[[:digit:]]{1}.*[[:alpha:]]{1}[[:digit:]]{1}|[[:digit:]]{1}[[:alpha:]]{1}.*[[:digit:]]{1}[[:alpha:]]{1}")|
                                                        grepl(x = stringVector, pattern = "[[:digit:]]{5,}")) &
                                                       str_length(stringVector) > lengthCutoff)
  
  srcPath <- lapply(imageData$src, function(x) do.call(c,str_split(x,"/+"))[-(1:2)])
  
  # extract the actual image name without folder structure
  imageFilename <- sapply(srcPath, tail, 1)
  imageFolders <- lapply(srcPath, head, -1)
  
  # Count ID-like patterns in folders and file name
  countIDsPath <- sapply(imageFolders, function(x) findID(x, 5))
  countIDsFilename <- sapply(imageFilename, function(x) findID(do.call(c,str_split(x,"[?+&;=-_]+")), 8))
  imageData[, c("countIDsPath","countIDsFilename") := list(countIDsPath, countIDsFilename)]
  
  # statistics about image folders
  folderLengths <- mclapply(imageFolders, function(x){len <- nchar(x); len[length(len) == 0] <- 0; list(mini = min(len, na.rm = TRUE), maxi = max(len))})
  imageData[, c("minFolderLength", "maxFolderLength") := list(sapply(folderLengths,"[[","mini"), sapply(folderLengths,"[[","maxi"))]
  
  ### Match reference and header info ####
  # Function to select only the relevant parts of the references and header elements
  splitNselect <- function(src, del.domains = FALSE){
    # Date detection is currently missing, because it takes too much time (> 5min)
    #datedigits <- table(strsplit(date, "")[[1]])
    #names <- names(datedigits)
    #values <- as.numeric(datedigits)
    
    if(del.domains == TRUE) src <- str_replace_all(src, "@.*?[[?>]]|//.*?/", "")
    parts <- do.call(c,str_split(src,"[/_\\-.=@:?<>&;$()\\[\\]{}+ ]+"))[-1]
    parts <- parts[nchar(parts) > 6]
    if(length(parts > 0)){
      parts <- parts[grepl(pattern = "[[:digit:][:upper:]]", parts)]
      #& !sapply(strsplit(parts, ""), function(x) {a <- table(x); identical(names(a), names) & identical(as.numeric(a),values)})]
    }else{
      parts <- NA
    }
    return(parts)
  } 
  srcParts <- lapply(imageData$src, function(x){a <- splitNselect(x, del.domains = TRUE); if(length(a)==0){NA}else{paste(a,collapse = "|")}})
  unsubscribeParts <- lapply(imageData$list.unsubscribe, splitNselect)
  returnParts <- lapply(imageData$return.path, splitNselect)
  spfParts <- lapply(imageData$received.spf, splitNselect)
  
  # Compare the parts of the reference to the corresponding parts of the header and add as feature
  imageData[, matchSrcUnsubscribe := mapply(function(pattern, stringlist) if(is.na(pattern[1])) 0 else{any(grepl(pattern = paste(pattern, collapse = "|"), stringlist))},
                                            srcParts, unsubscribeParts)]
  imageData[, matchSrcSpf := mapply(function(pattern, stringlist) if(is.na(pattern[1])) 0 else{any(grepl(pattern = paste(pattern, collapse = "|"), stringlist))},
                                    srcParts, spfParts)]
  imageData[, matchSrcReturn := mapply(function(pattern, stringlist) if(is.na(pattern[1])) 0 else{any(grepl(pattern = paste(pattern, collapse = "|"), stringlist))},
                                       srcParts, returnParts)]
  
  ### Image name ####
  
  # length of image name
  imageData[, imageFilenameLength := str_length(imageFilename)]
  imageData[, relFilenameLength:= (imageFilenameLength - median(imageFilenameLength)) /
              max(0.05, sd(imageFilenameLength), na.rm=TRUE)
            , by = mailID]
  
  # largest string of numbers
  imageData[,longestNr:=            
              sapply(imageFilename,
                     function(x){max(c(nchar(
                       do.call(c,str_extract_all(x,"[0-9]+"))),0)
                     )})
            ]
  
  # number of long number strings (>4)
  imageData[, nrStringsCount := countOccurances(imageFilename,"[0-9]{5,}")]
  
  # number of '='
  imageData[, equalSignCount := countOccurances(imageFilename,"=")]
  
  # number of sonderzeichen
  imageData[, punctCharCount := countOccurances(imageFilename,"[:punct:]")]
  
  # number of words in image name
  imageData[,nrOfWords := countOccurances(imageFilename,pattern = "[[:lower:]]{4,}")]
  
  ### File Format 
  # define if the file format is one of the common picture formats or other
  temp.file <- gsub(x = imageData$src, "\\?.*", "") %>% tolower %>% str_sub(start = -5) %>% str_extract(pattern = "\\.+[:alnum:]*") %>% gsub(pattern = "\\.*",  replacement = "")
  imageData[, fileFormat := temp.file]
  imageData[is.na(fileFormat), fileFormat := "none"]
  imageData[fileFormat == "jpeg",fileFormat:="jpg"]
  imageData[!(fileFormat %in% c("jpg","gif","png","none","php")), fileFormat := "other"]
  imageData[, fileFormat := factor(fileFormat)]
  
  # with how many pictures does the images share a file type in the mail?
  imageData[,sharedFileformat := ((.N - 1)/imgCount), by = .(mailID, fileFormat)]
  
  ### Domain comparison ####
  # Extract the image domain/company
  imageData[, domain := str_extract(src,"//[[:print:]]+?/")]
  imageData[is.na(domain), domain := str_extract(src,"//[[:print:]]+")]
  imageData[, domainLength := str_length(domain)]
  # extract sender domain
  imageData[,senderDomain := tolower(as.character(lapply(str_split(
    str_split_fixed(from_mail,"@",n=2)[,2]
    ,"[.]"),function(x)rev(x)[[2]]))
  )
  ]
  # extract unsubscribe address to add robustness
  #test <- str_extract_all(str_split(imageData$list.unsubscribe,","),"@.+>")
  
  # sender matches image domain (or unsubscribe domain, if possible)
  temp.from_name <- imageData$from_name %>% str_replace_all(pattern = "[?+]|.de|.com", replacement = "") %>% str_split(pattern = "[ [:punct:]\\|]+") %>% sapply(., paste, collapse = "|")
  imageData[, matchSendernameImage := as.numeric(mapply(grepl, x = imageData$domain, pattern = temp.from_name, ignore.case = TRUE))]
  # sender domain or first word of display name in image domain?
  imageData[, imageSenderSameDomain := as.numeric(str_detect(domain, pattern = senderDomain))]
  # with how many pictures does the images share a domain in the mail?
  imageData[, sharedDomain := ((.N - 1)/imgCount), by = .(mailID, domain)]
  
  #### Image border ####  
  # default value for NA is "medium", so change accordingly
  imageData[grepl("'",border),
            border := str_extract(border,"[[:digit:]+]")
            ]
  imageData[border=="", border := "3"]
  imageData[border=="medium", border := "3"]
  imageData[suppressWarnings(is.na(as.numeric(border))), border := str_extract(border, "[[:digit:]+]")]
  imageData[, border := as.numeric(border)]
  imageData[is.na(border),  border := 0]
  
  #### Style features #######
  # Color
  imageData[, style_color := as.numeric(!style_color == "")]
  # Background_color
  imageData[, style_background.color := as.numeric(!(style_background.color == "" | style_background.color == "#none"))]
  # display
  imageData[, style_display := as.numeric(!style_display == "" | grepl(pattern = "none", style_display))]
  # font family
  imageData[, style_font.family := as.numeric(!style_font.family == "")]
  # font size
  imageData[, style_font.size := as.numeric(!style_font.size == "")]
  
  # height
  imageData[grepl("%", style_height), style_height := NA]
  imageData[, style_height := str_extract(style_height,"[[:digit:]]+^%")]
  # width
  imageData[grepl("%", style_width), style_width := NA]
  imageData[, style_width := str_extract(style_width,"[[:digit:]]+")]
  # max-height
  imageData[grepl("%", style_max.height), style_max.height := NA]
  imageData[, style_max.height := str_extract(style_max.height,"[[:digit:]]+")]
  # max-width
  imageData[grepl("%", style_max.width), style_max.width := NA]
  imageData[, style_max.width := str_extract(style_max.width,"[[:digit:]]+")]
  
  ##### AREA/SIZE START #####
  imageData[width == ""|grepl("%",width)|width=="auto"|width=="initial", width := NA]
  imageData[height == ""|grepl("%",height)|height=="auto"|height=="initial", height := NA]
  
  # drop the "px" from width/height
  imageData[grepl("px|'|/",width),
            width := str_extract(width,"[[:digit:]]+")
            ]
  imageData[grepl("px|'|/",height),
            height := str_extract(height,"[[:digit:]]+")
            ]
  
  # replace width by the width in pixel from style
  imageData[is.na(width) & !is.na(style_width),
            width := style_width
            ]
  imageData[is.na(height) & !is.na(style_height),
            height := style_height
            ]
  
  # replace unclear value with values from file name, where possible
  temp.filenameSize <- gsub("^.|.$","",    # drop first and last character
                            str_extract_all(imageData$imageFilename, "[^[:digit:]][:digit:]{2,3}[:space:]*[x_-]{1}[:space:]*[:digit:]{2,3}[.]",simplify=TRUE)) %>%
    str_split_fixed(., pattern = "[x_-]{1}" , n = 2) %>%
    apply(., 2, function(x)as.character(as.numeric(x))) %>% data.table
  
  temp.filenameSize$width <- is.na(imageData$width) & !is.na(temp.filenameSize[[1]])
  temp.filenameSize$height <- is.na(imageData$height) & !is.na(temp.filenameSize[[2]])
  
  imageData[temp.filenameSize$width,
            width := temp.filenameSize[temp.filenameSize$width, 1, with = FALSE]
            ]
  imageData[temp.filenameSize$height,
            height := temp.filenameSize[temp.filenameSize$height, 2, with = FALSE]
            ]
  
  # change width and height to numeric
  suppressWarnings(imageData[,c("width","height") := list(as.numeric(width),as.numeric(height))])
  
  # Area
  imageData[,area := width*height]
  imageData[area == 0, areaClass := "area00px"]
  imageData[area == 1, areaClass := "area01px"]
  imageData[area > 1 & area <= 10, areaClass := "area01to10px"]
  imageData[area > 10 & area <= 100, areaClass := "area10pxto100px"]
  imageData[area > 100, areaClass := "area100pxPlus"]
  imageData[is.na(area), areaClass := "areaMissing"]
  #imageData[, areaClass := factor(areaClass, levels = c("area00px", "area1px", "area1to10px", "area10to100px", "areaOver100px", "areaMissing"), ordered = TRUE)]
  imageData[, areaClass := factor(areaClass)]
  
  # Standardized width height ratio, 1 for square, goes increasing for diverging
  #imageData[,stdWidthHeightRatio := apply(imageData[,.(width, height)], 1, function(x) log( max(x)/max(min(x), 0.1) + 1))]
  # log of the deviation between height and width * make negative for vertical positive for horizontal images
  imageData[,stdWidthHeightRatio := log((pmax(height, width) +1) / (pmin(height,width) +1)) * ((width >= height) * 2 -1) ]
  imageData[is.na(stdWidthHeightRatio), stdWidthHeightRatio := 0]
  
  # to test absolute size, missing value where (conservatively) changed to size 1
  imageData[is.na(width), width := 1]
  imageData[is.na(height), height := 1]
  imageData[, area := width * height]
  
  # Ratio of images which are smaller
  imageData[, ratioSmallerImg:= as.numeric(sapply(area, function(x) sum(x >= area)-1) / imgCount), by = mailID]
  
  ## image area
  imageData[, by = mailID, outsiderArea := outsider(area)]
  
  ##### SIZE/AREA END ###
  
  ### Prepare hspace and vspace
  # imageData[grepl("'",vspace),
  #           vspace := str_extract(vspace,"[[:digit:]+]")
  #           ]
  # imageData[, vspace:= ifelse(vspace == "", 0 , ifelse(vspace == 0, 0, 1))]
  # imageData[grepl("'",hspace),
  #           hspace := str_extract(hspace,"[[:digit:]+]")
  #           ]
  # imageData[, hspace := ifelse(hspace == "", 0 , ifelse(hspace == 0, 0, 1))]
  imageData[, vhspace := as.numeric(vspace != "" | hspace != "")]
  
  
  ### Existence of other image tags ####
  # imageData[alt == " ", alt:=NA]
  # imageData[title == " ", title:=NA]
  # imageData[class == " ", class:=NA]
  # imageData[style == " ", style:=NA]
  
  imageData[,altLength := str_length(alt)]
  imageData[,titleLength := str_length(title)]
  imageData[,classLength := str_length(class)]
  imageData[,idLength := str_length(id)]
  imageData[, align := as.numeric(!align == "")]
  
  # Unsubscribe address characteristics
  imageData[, unsubscribeLength := str_length(list.unsubscribe)]
  imageData[, unsubscribeAdresses := str_count("<", string = list.unsubscribe)]
  
  # Mail content type
  imageData[, contentTypeLength := str_length(content.type)]
  
  # imageData[,titleExists:=
  #             as.numeric(title != "missing" & title != "" & !is.na(title))]
  # imageData[,classExists:=
  #             as.numeric(class != "missing" & class != "" & !is.na(class))]
  
  # Description of image occurs in subject line
  #imageData[,contentImg := as.numeric(str_detect(subject,fixed(alt)) | str_detect(subject,fixed(title)))]
  #imageData[is.na(contentImg), contentImg := 0]
  
  ### Make factors from character
  factor.selector <- sapply(imageData, is.character)
  imageData[, colnames(imageData)[factor.selector] := lapply(imageData[, factor.selector, with = FALSE], factor)]
  
  # Transform factor to dummy
  factorCols <- c("areaClass", "fileFormat")
  imageData <- cbind(imageData, model.matrix(~.-1, data = imageData[, (factorCols), with=FALSE]))
  imageData[, (factorCols) := NULL]
  
  return(imageData)
}

