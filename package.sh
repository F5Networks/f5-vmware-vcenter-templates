tar -C .. --exclude=".git*" --exclude="test" --exclude="dist" -cf dist/f5-vmware-vcenter-templates.tar f5-vmware-vcenter-templates

gzip -nf dist/f5-vmware-vcenter-templates.tar

# Update hash in dist/hash
openssl dgst -sha512 dist/f5-vmware-vcenter-templates.tar.gz | cut -d ' ' -f 2 > dist/packageHash