require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = "react-native-image-editor"
  s.version      = package['version']
  s.summary      = package['description']
  s.license      = package['license']

  s.authors      = package['author']
  s.homepage     = package['homepage']
  s.platforms    = { :ios => min_ios_version_supported }

  s.source       = { :git => "https://github.com/callstack/react-native-image-editor.git", :tag => "#{s.version}" }
  s.source_files  = "ios/**/*.{h,m,mm}"

  s.dependency 'React-RCTImage'

  install_modules_dependencies(s)
end
